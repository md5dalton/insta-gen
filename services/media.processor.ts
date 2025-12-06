import { MEDIA_CONFIG } from "@/config/media"
import { PrismaClient, User } from "@prisma/client"
import chokidar, { FSWatcher } from "chokidar"
import { throttle } from "lodash"
import crypto from "crypto"
import prisma from "@/lib/prisma"
import { Video } from "./service.video"
import { stat } from "fs/promises"
import sharp, {  } from "sharp"
import { MediaType, VideoMetadata } from "@/types/type"
import { homedir } from "os"
import * as path from "path"
import * as fs from "fs"

interface FileUpdate {
    event: "add" | "change" | "delete" | "addDir" | "deleteDir"
    timestamp: number
    id: string
}

interface Metadata {
    width: number
    height: number
    duration: string | null
    mktime: string
}

enum PictureType {
    Media = "m",
    Thumb = "t"
}

const MEDIA_ROOT = process.env.MEDIA_ROOT ?
    path.join(homedir(), process.env.MEDIA_ROOT) :
    path.join(process.cwd(), "media")

if (!fs.existsSync(MEDIA_ROOT)) fs.mkdirSync(MEDIA_ROOT, { recursive: true })



class DebouncedMediaProcessor {
    private path: string
    private prisma: PrismaClient
    private isProcessing: boolean
    private watcher: FSWatcher | null
    private processThrottled: () => void
    private pendingUpdates: Map<string, FileUpdate>


    constructor(path: string) {
        this.path = path
        this.prisma = prisma
        this.isProcessing = false
        this.watcher = null
        this.pendingUpdates = new Map()
        
        this.processThrottled = throttle(() => this.processPending(), MEDIA_CONFIG.DEBOUNCE_MS, {
            leading: false,
            trailing: true
        })

    }
    
    async initialize(): Promise<void> {
        console.log("🔄 Initializing media processor...")
        
        // Initialize global state
        if (!global.syncState) {
            global.syncState = {
                isInitialized: false,
                isProcessing: false,
                lastSync: null,
                stats: {
                    processed: 0,
                    errors: 0
                }
            }
        }

        // await this.initialScan()
        const extensions = new Set([
            ...MEDIA_CONFIG.IMAGE_EXTENSIONS,
            ...MEDIA_CONFIG.VIDEO_EXTENSIONS
        ])
        
        this.watcher = chokidar.watch(`${this.path}`, {
            ignored: file => {
                const ext = path.extname(file).toLowerCase()
                return ext && !extensions.has(ext)
            },
            persistent: true,
            ignoreInitial: false,
            depth: 10
        })

        this.watcher
            .on("add", (filePath: string) => this.queueUpdate("add", filePath))
            .on("change", (filePath: string) => this.queueUpdate("change", filePath))
            .on("unlink", (filePath: string) => this.queueUpdate("delete", filePath))
            // .on("addDir", (dirPath: string) => this.queueUpdate("addDir", dirPath.replace(rootPath, "")))
            // .on("unlinkDir", (dirPath: string) => this.queueUpdate("deleteDir", dirPath.replace(rootPath, "")))

        global.syncState.isInitialized = true
        console.log("✅ Media processor initialized and watching for changes")
    }
    
    private queueUpdate(event: FileUpdate["event"], filePath: string): void {
        this.pendingUpdates.set(filePath, { 
            event, 
            timestamp: Date.now(),
            id: `${event}-${filePath}-${Date.now()}`
        })
        
        // console.log(`📝 Queued ${event}: ${path.basename(filePath)}`)
        this.processThrottled()
    }
    
    private async processPending(): Promise<void> {
        if (this.isProcessing || this.pendingUpdates.size === 0) return

        this.isProcessing = true
        global.syncState.isProcessing = true

        const updates = Array.from(this.pendingUpdates.entries())
        this.pendingUpdates.clear()

        console.log(`🔄 Processing ${updates.length} pending changes...`)

        try {
            const groupedUpdates = this.groupUpdatesByDirectory(updates)
        
            for (const [directory, directoryUpdates] of groupedUpdates) {
                await this.processDirectoryBatch(directory, directoryUpdates)
            }

            global.syncState.lastSync = new Date()
            global.syncState.stats.processed += updates.length
            
            console.log(`✅ Successfully processed ${updates.length} changes`)
        
        } catch (error) {
            console.error("❌ Error processing updates:", error)
            global.syncState.stats.errors += updates.length
        } finally {
            this.isProcessing = false
            global.syncState.isProcessing = false
        
            if (this.pendingUpdates.size > 0) this.processThrottled()
        }
    }

    private groupUpdatesByDirectory(updates: [string, FileUpdate][]): Map<string, Array<FileUpdate & { filePath: string }>> {
        const groups = new Map<string, Array<FileUpdate & { filePath: string }>>()
        
        for (const [filePath, update] of updates) {
            const directory = path.dirname(filePath)
            if (!groups.has(directory)) {
                groups.set(directory, [])
            }
            groups.get(directory)!.push({ filePath, ...update })
        }
        
        return groups
    }
    
    private generateId = (path: string) => {
        
        const hash = crypto.createHash("sha256").update(path).digest("hex")

        const base64Hash = Buffer.from(hash, "hex").toString("base64")

        return base64Hash.replace(/[^a-zA-Z0-9]/g, "").substring(0, 8)
        
    }

    private async processDirectoryBatch(directory: string, updates: Array<FileUpdate & { filePath: string }>): Promise<void> {
        // console.log(`📁 Processing directory: ${directory}`)
        
        try {
            const relativePath = directory.replace(this.path, "")
            const pathParts = relativePath.split(path.sep).filter(Boolean)
            
            if (pathParts.length >= 3) {
                const [rootCollection, collection, user, ...tags] = pathParts
                
                const rootCollectionRecord = await this.ensureRootCollection(rootCollection)
                const collectionRecord = await this.ensureCollection(rootCollectionRecord.id, collection)
                const userRecord = await this.ensureUser(collectionRecord.id, user)
                
                const fileUpdates = updates.filter(update => 
                    update.event === "add" || update.event === "change" || update.event === "delete"
                )
                
                for (const update of fileUpdates) {
                    if (update.event === "delete") {
                        await this.handleFileDelete(update.filePath)
                    } else {
                        await this.handleFileAddOrChange(update.filePath, userRecord, tags)
                    }
                }
                
                await this.processTagsForDirectory(directory, userRecord, tags)
            }
        } catch (error) {
            console.error(`Error processing directory ${directory}:`, error)
            // throw error
        }
    }

    private async ensureRootCollection(name: string) {
        const path = `/${name}`
        const id = this.generateId(path)

        return await this.prisma.rootCollection.upsert({
            where: { id },
            update: { name },
            create: { id, name, path }
        })
    }

    private async ensureCollection(rootCollectionId: string, name: string) {
        const rootCollection = await this.prisma.rootCollection.findUnique({
            where: { id: rootCollectionId }
        })
        
        if (!rootCollection) throw new Error(`Root collection ${rootCollectionId} not found`)
        
        const path = `${rootCollection.path}/${name}`
        const id = this.generateId(path)
        
        return await this.prisma.collection.upsert({
            where: { id },
            update: { name },
            create: {
                id,
                name, 
                path,
                ownerId: rootCollectionId 
            }
        })
    }

    private async ensureUser(collectionId: string, name: string) {
        const collection = await this.prisma.collection.findUnique({
            where: { id: collectionId }
        })
        
        if (!collection) throw new Error(`Collection ${collectionId} not found`)
        
        const path = `${collection.path}/${name}`
        const id = this.generateId(path)

        return await this.prisma.user.upsert({
            where: { id },
            update: { name },
            create: { 
                id,
                name, 
                path,
                ownerId: collectionId 
            }
        })
    }
    
    private async assignUserPicture (mediaId: string, userId: string, type: PictureType = PictureType.Media) {
        return await this.prisma.user.update({
            where: { id: userId},
            data: { picture: `${type}:${mediaId}` }
        })
    }

    private async handleFileAddOrChange(filePath: string, user: User, tags: string[]): Promise<void> {
        const relativePath = filePath.replace(this.path, "")
        const id = this.generateId(filePath)
        const type = this.getType(filePath)
        
        let metadata: any

        const mediaExists = await this.prisma.media.count({where: {id}})

        if (!mediaExists) {
            if (type === MediaType.VIDEO) {
                const video = new Video(filePath)
                metadata = await video.getMetadata()
                
                if (metadata) await video.extractThumbnail(id)
    
            } else {
                metadata = await sharp(filePath).metadata()
            } 
    
            if (metadata) {
                const stats = await stat(filePath)
                
                await this.prisma.media.create({
                    data: {
                        id,
                        path: relativePath,
                        type,
                        owner: { connect: { id: user.id } },
                        height: metadata.height,
                        width: metadata.width,
                        duration: type === MediaType.VIDEO ? metadata.duration : null,
                        mktime: String(stats.birthtimeMs)
                    }
                })
        
                console.log(`✅ Processed media: ${path.basename(filePath)}`)
                
            } else {
                console.log(`❌ Failed to process media: ${path.basename(filePath)}`)
            }
        }
        
        if (!user.picture) {
            this.assignUserPicture(
                id,
                user.id,
                type === MediaType.VIDEO ? PictureType.Thumb : PictureType.Media
            )
        }
        await this.processMediaTags(id, user.path, tags)
    }

    private async handleFileDelete(filePath: string): Promise<void> {
        const id = this.generateId(filePath)

        await this.prisma.media.delete({
            where: { id }
        })
        console.log(`🗑️  Deleted media: ${path.basename(filePath)}`)
    }

    private async processMediaTags(mediaId: string, userPath: string, tags: string[]): Promise<void> {
        await this.prisma.mediaTag.deleteMany({
            where: { mediaId }
        })
        
        for (let i = 0; i < tags.length; i++) {
            const tagPath = userPath + "/" + tags.slice(0, i + 1).join("/")
            const tagName = tags[i]
            const id = this.generateId(tagPath)
            
            const tag = await this.prisma.tag.upsert({
                where: { id },
                update: { name: tagName },
                create: { name: tagName, id }
            })
            
            await this.prisma.mediaTag.create({
                data: {
                    id: this.generateId(`media-${mediaId}-tag-${tag.id}`),
                    mediaId,
                    tagId: tag.id
                }
            })
        }
    }

    private async processTagsForDirectory(directory: string, userRecord: User, tags: string[]): Promise<void> {
        for (let i = 0; i < tags.length; i++) {
            const tagPath = userRecord.path + "/" + tags.slice(0, i + 1).join("/")
            const tagName = tags[i]
            const id = this.generateId(tagPath)
            
            await this.prisma.tag.upsert({
                where: { id },
                update: { name: tagName },
                create: { name: tagName, id }
            })
        }
    }

    private getType(filePath: string): MediaType {
        const videoExtensions = MEDIA_CONFIG.VIDEO_EXTENSIONS
        const ext = path.extname(filePath).toLowerCase()
        return videoExtensions.includes(ext) ? MediaType.VIDEO : MediaType.IMAGE
    }

    private async initialScan(): Promise<void> {
        console.log("🔍 Performing initial media scan...")
        // Initial scan logic would go here
        console.log("✅ Initial scan completed")
    }

    async dispose(): Promise<void> {
        if (this.watcher) await this.watcher.close()
            
        await this.prisma.$disconnect()
    }
}

export const mediaProcessorInstance = new DebouncedMediaProcessor(MEDIA_ROOT)