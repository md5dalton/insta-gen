import { MEDIA_CONFIG } from "@/config/media"
import { dirname, extname, sep, join } from "path"
import chokidar, { FSWatcher } from "chokidar"
import { readdir, realpath, stat } from "fs/promises"
import throttle from "lodash/throttle"
import prisma from "@/lib/prisma"
import { Collection, PrismaClient, RootCollection } from "@/prisma/generated/client"
import { enqueueMediaJob } from "@/lib/enqueue"
import { generateId } from "@/lib/path"
import { File } from "@/types/type"
import { MediaService } from "./mediaService"

type FileUpdate = {
    event: "add" | "change" | "delete"
    timestamp: number
    file: File
}

export default class DebouncedMediaProcessor {
    private root: string
    private prisma: PrismaClient
    private mediaService: MediaService
    private isProcessing: boolean
    private watcher: FSWatcher | null
    private processThrottled: () => void
    private pendingUpdates: Map<string, FileUpdate>

    // 🚀 CACHES
    private rootCache = new Map<string, any>()
    private collectionCache = new Map<string, any>()
    private userCache = new Map<string, any>()
    private tagCache = new Map<string, any>()

    constructor() {
        this.root = MEDIA_CONFIG.ROOT_PATH
        this.prisma = prisma
        this.isProcessing = false
        this.watcher = null
        this.pendingUpdates = new Map()
        this.mediaService = new MediaService(prisma)

        this.processThrottled = throttle(
            () => this.processPending(),
            MEDIA_CONFIG.DEBOUNCE_MS,
            { leading: false, trailing: true }
        )
    }

    async initialize(): Promise<void> {
        console.log("🔄 Initializing media processor...")

        if (!global.syncState) {
            global.syncState = {
                isInitialized: false,
                isProcessing: false,
                lastSync: null,
                stats: {
                    processed: 0,
                    errors: 0,
                    queued: 0
                }
            }
        }

        // ✅ Initial scan (batched, controlled)
        await this.initialScan()

        const extensions = new Set([
            ...MEDIA_CONFIG.IMAGE_EXTENSIONS,
            ...MEDIA_CONFIG.VIDEO_EXTENSIONS
        ])

        this.watcher = chokidar.watch(this.root, {
            ignored: (file: string) => {
                const ext = extname(file).toLowerCase()
                return Boolean(ext && !extensions.has(ext))
            },
            persistent: true,
            ignoreInitial: true,
            depth: 10
        })

        this.watcher
            .on("add", (filePath) => this.queueUpdate("add", {path: filePath, id: this.generateId(filePath)}))
            .on("change", (filePath) => this.queueUpdate("change", {path: filePath, id: this.generateId(filePath)}))
            .on("unlink", (filePath) => this.queueUpdate("delete", {path: filePath, id: this.generateId(filePath)}))

        global.syncState.isInitialized = true

        console.log("✅ Media processor ready (scan + watcher)")
    }

    // =========================================================
    // 🧠 INITIAL SCAN (BATCHED + OPTIMIZED)
    // =========================================================

    private async initialScan(): Promise<void> {
        console.log("🔍 Starting initial media scan...")

        const files: string[] = []

        const extensions = new Set([
            ...MEDIA_CONFIG.IMAGE_EXTENSIONS,
            ...MEDIA_CONFIG.VIDEO_EXTENSIONS
        ])
        
        const seen = new Set<string>()

        const walk = async (dir: string) => {

            const real = await realpath(dir)
            if (seen.has(real)) return
            seen.add(real)

            const entries = await readdir(dir, { withFileTypes: true })

            for (const entry of entries) {
                const fullPath = join(dir, entry.name)

                if (entry.isDirectory()) {
                    await walk(fullPath)
                } else if (entry.isSymbolicLink()) {
                    try {
                        const resolved = await stat(fullPath)

                        if (resolved.isDirectory()) {
                            await walk(fullPath)
                        } else if (resolved.isFile()) {
                            const ext = extname(entry.name).toLowerCase()
                            if (extensions.has(ext)) {
                                files.push(fullPath)
                            }
                        }
                    } catch (err) {
                        // broken symlink or permission issue
                        console.warn("Skipping symlink:", fullPath)
                    }

                } else {
                    const ext = extname(entry.name).toLowerCase()
                    if (extensions.has(ext)) {
                        files.push(fullPath)
                    }
                }
            }
        }
        
        await walk(this.root)

        console.log(`📂 Found ${files.length} media files`)

        const existing = await this.prisma.media.findMany({
            select: {id: true}
        })

        const existingIds = new Set(existing.map(e => e.id))

        const newFiles: File[] = []

        for (const path of files) {
            const id = this.generateId(path)
            if (!existingIds.has(id)) newFiles.push({ path, id })
        }

        console.log(`📂 ${newFiles.length} new media files to be processed`)

        const BATCH_SIZE = 5000

        for (let i = 0; i < newFiles.length; i += BATCH_SIZE) {
            const batch = newFiles.slice(i, i + BATCH_SIZE)

            await this.processInitialBatch(batch)

            console.log(`📦 Scanned ${i + batch.length}/${newFiles.length}`)
        }

        console.log("✅ Initial scan completed")
    }

    private async processInitialBatch(files: File[]): Promise<void> {
        const grouped = this.groupFilesByDirectory(files)

        for (const [directory, filePaths] of grouped) {
            await this.processInitialDirectory(directory, filePaths)
        }
    }

    private async processInitialDirectory(directory: string, files: File[]) {
        try {
            const context = await this.resolveContext(directory)
            if (!context) return

            const { userId, tags } = context

            for (const file of files) await this.enqueue(file, "add", userId, tags)

        } catch (err) {
            console.error(`❌ Initial scan error in ${directory}`, err)
        }
    }

    // =========================================================
    // ⚡ LIVE UPDATES (DEBOUNCED)
    // =========================================================

    private queueUpdate(event: FileUpdate["event"], file: File): void {
        this.pendingUpdates.set(file.path, {
            event,
            file,
            timestamp: Date.now()
        })

        this.processThrottled()
    }

    private async processPending(): Promise<void> {
        if (this.isProcessing || this.pendingUpdates.size === 0) return

        this.isProcessing = true
        global.syncState.isProcessing = true

        const updates = Array.from(this.pendingUpdates.entries())
        this.pendingUpdates.clear()

        console.log(`📦 Queuing ${updates.length} file changes...`)

        try {
            const grouped = this.groupUpdatesByDirectory(updates)

            for (const [directory, directoryUpdates] of grouped) {
                await this.processDirectoryBatch(directory, directoryUpdates)
            }

            global.syncState.lastSync = new Date()
            global.syncState.stats.processed += updates.length

        } catch (error) {
            console.error("❌ Error queuing updates:", error)
            global.syncState.stats.errors += updates.length
        } finally {
            this.isProcessing = false
            global.syncState.isProcessing = false

            if (this.pendingUpdates.size > 0) {
                this.processThrottled()
            }
        }
    }

    private async processDirectoryBatch(
        directory: string,
        updates: Array<FileUpdate>
    ): Promise<void> {
        try {
            const context = await this.resolveContext(directory)
            if (!context) return

            const { userId, tags } = context

            for (const update of updates) {
                await this.enqueue(update.file, update.event, userId, tags)
            }

        } catch (error) {
            console.error(`❌ Error processing directory ${directory}:`, error)
        }
    }

    // =========================================================
    // 🧠 SHARED HELPERS
    // =========================================================

    private async resolveContext(directory: string) {
        const relativePath = directory.replace(this.root, "")
        const parts = relativePath.split(sep).filter(Boolean)

        if (parts.length < 3) return null

        const tags = []

        const [rootCollection, collection, user] = parts

        const userPath = join(rootCollection, collection, user)

        for (let i = 0; i < parts.length; i++) {
            const tagPath = join(...parts.slice(0, i + 1))

            if (userPath !== tagPath) {
                const tag = await this.ensureTag(tagPath)
                tags.push(tag.id)
            }
        }

        const root = await this.ensureRootCollection(rootCollection)
        const col = await this.ensureCollection(root, collection)
        const usr = await this.ensureUser(col, user)

        return { userId: usr.id, tags }
    }

    private async enqueue(
        { id, path }: File,
        event: FileUpdate["event"],
        userId: string,
        tags: string[]
    ) {
        // await enqueueMediaJob({ file, event, userId, tags })

        if (event === "delete") {
            await this.mediaService.handleDelete(id)
        } else {
            await this.mediaService.handleAddOrChange(
                {
                    id,
                    path
                },
                userId,
                tags
            )
        }
        global.syncState.stats.queued++
    }

    private groupFilesByDirectory(files: File[]) {
        const map = new Map<string, File[]>()

        for (const file of files) {
            const dir = dirname(file.path)
            if (!map.has(dir)) map.set(dir, [])
            map.get(dir)!.push(file)
        }

        return map
    }

    private groupUpdatesByDirectory(
        updates: [string, FileUpdate][]
    ) {
        const map = new Map<string, Array<FileUpdate>>()

        for (const [filePath, update] of updates) {
            const dir = dirname(filePath)
            if (!map.has(dir)) map.set(dir, [])
            map.get(dir)!.push(update)
        }

        return map
    }

    private generateId(path: string) {
        return generateId(path)
    }

    // =========================================================
    // 🚀 CACHED DB HELPERS
    // =========================================================

    private async ensureRootCollection(name: string) {
        if (this.rootCache.has(name)) return this.rootCache.get(name)

        const path = `/${name}`
        const id = this.generateId(path)

        const record = await this.prisma.rootCollection.upsert({
            where: { id },
            update: { name },
            create: { id, name, path }
        })

        this.rootCache.set(name, record)
        return record
    }

    private async ensureCollection(root: RootCollection, name: string) {
        const key = `${root.id}:${name}`
        if (this.collectionCache.has(key)) return this.collectionCache.get(key)

        const path = `${root.path}/${name}`
        const id = this.generateId(path)

        const record = await this.prisma.collection.upsert({
            where: { id },
            update: { name },
            create: { id, name, path, ownerId: root.id }
        })

        this.collectionCache.set(key, record)
        return record
    }

    private async ensureUser(collection: Collection, name: string) {
        const key = `${collection.id}:${name}`
        if (this.userCache.has(key)) return this.userCache.get(key)

        const path = `${collection.path}/${name}`
        const id = this.generateId(path)

        const record = await this.prisma.user.upsert({
            where: { id },
            update: { name },
            create: { id, name, path, ownerId: collection.id }
        })

        this.userCache.set(key, record)
        return record
    }
    private async ensureTag(path: string) {
        if (this.tagCache.has(path)) return this.tagCache.get(path)

        const id = this.generateId(path)
        const name = path.split(sep).pop() || path

        const tag = await this.prisma.tag.upsert({
            where: { id },
            update: { name },
            create: { name, id }
        })

        this.tagCache.set(path, tag)
        return tag
    }

    async dispose(): Promise<void> {
        if (this.watcher) {
            await this.watcher.close()
            this.watcher = null
        }

        await this.prisma.$disconnect()
    }
}