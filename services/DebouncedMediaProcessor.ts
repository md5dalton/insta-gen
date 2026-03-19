import { MEDIA_CONFIG } from "@/config/media"
import { dirname, extname, sep, join } from "path"
import chokidar, { FSWatcher } from "chokidar"
import { readdir } from "fs/promises"
import throttle from "lodash/throttle"
// import { throttle } from "lodash"
import prisma from "@/lib/prisma"
import crypto from "crypto"
import { Collection, PrismaClient, RootCollection, User } from "@/prisma/generated/client"
import { enqueueMediaJob } from "@/lib/enqueue"

type FileUpdate = {
    event: "add" | "change" | "delete"
    timestamp: number
    id: string
}

export default class DebouncedMediaProcessor {
    private root: string
    private prisma: PrismaClient
    private isProcessing: boolean
    private watcher: FSWatcher | null
    private processThrottled: () => void
    private pendingUpdates: Map<string, FileUpdate>

    // 🚀 CACHES
    private rootCache = new Map<string, any>()
    private collectionCache = new Map<string, any>()
    private userCache = new Map<string, any>()

    constructor() {
        this.root = MEDIA_CONFIG.ROOT_PATH
        this.prisma = prisma
        this.isProcessing = false
        this.watcher = null
        this.pendingUpdates = new Map()

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
            .on("add", (filePath) => this.queueUpdate("add", filePath))
            .on("change", (filePath) => this.queueUpdate("change", filePath))
            .on("unlink", (filePath) => this.queueUpdate("delete", filePath))

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

        const walk = async (dir: string) => {
            const entries = await readdir(dir, { withFileTypes: true })

            for (const entry of entries) {
                const fullPath = join(dir, entry.name)

                if (entry.isDirectory()) {
                    await walk(fullPath)
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

        const BATCH_SIZE = 100

        for (let i = 0; i < files.length; i += BATCH_SIZE) {
            const batch = files.slice(i, i + BATCH_SIZE)

            await this.processInitialBatch(batch)

            console.log(`📦 Scanned ${i + batch.length}/${files.length}`)
        }

        console.log("✅ Initial scan completed")
    }

    private async processInitialBatch(files: string[]): Promise<void> {
        const grouped = this.groupFilesByDirectory(files)

        for (const [directory, filePaths] of grouped) {
            await this.processInitialDirectory(directory, filePaths)
        }
    }

    private async processInitialDirectory(directory: string, filePaths: string[]) {
        try {
            const context = await this.resolveContext(directory)
            if (!context) return

            const { userId, tags } = context

            // 🚀 Batch DB lookup
            const ids = filePaths.map(fp => this.generateId(fp))

            const existing = await this.prisma.media.findMany({
                where: { id: { in: ids } },
                select: { id: true }
            })

            const existingSet = new Set(existing.map(e => e.id))

            for (const filePath of filePaths) {
                const id = this.generateId(filePath)
                if (existingSet.has(id)) continue

                await this.enqueue(filePath, "add", userId, tags)
            }

        } catch (err) {
            console.error(`❌ Initial scan error in ${directory}`, err)
        }
    }

    // =========================================================
    // ⚡ LIVE UPDATES (DEBOUNCED)
    // =========================================================

    private queueUpdate(event: FileUpdate["event"], filePath: string): void {
        this.pendingUpdates.set(filePath, {
            event,
            timestamp: Date.now(),
            id: `${event}-${filePath}`
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
        updates: Array<FileUpdate & { filePath: string }>
    ): Promise<void> {
        try {
            const context = await this.resolveContext(directory)
            if (!context) return

            const { userId, tags } = context

            for (const update of updates) {
                await this.enqueue(update.filePath, update.event, userId, tags)
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

        const [rootCollection, collection, user, ...tags] = parts

        const root = await this.ensureRootCollection(rootCollection)
        const col = await this.ensureCollection(root, collection)
        const usr = await this.ensureUser(col, user)

        return { userId: usr.id, tags }
    }

    private async enqueue(
        filePath: string,
        event: FileUpdate["event"],
        userId: string,
        tags: string[]
    ) {
        await enqueueMediaJob({ filePath, event, userId, tags })
        global.syncState.stats.queued++
    }

    private groupFilesByDirectory(files: string[]) {
        const map = new Map<string, string[]>()

        for (const file of files) {
            const dir = dirname(file)
            if (!map.has(dir)) map.set(dir, [])
            map.get(dir)!.push(file)
        }

        return map
    }

    private groupUpdatesByDirectory(
        updates: [string, FileUpdate][]
    ) {
        const map = new Map<string, Array<FileUpdate & { filePath: string }>>()

        for (const [filePath, update] of updates) {
            const dir = dirname(filePath)
            if (!map.has(dir)) map.set(dir, [])
            map.get(dir)!.push({ filePath, ...update })
        }

        return map
    }

    private generateId(path: string) {
        const hash = crypto.createHash("sha256").update(path).digest("hex")
        return Buffer.from(hash, "hex")
            .toString("base64")
            .replace(/[^a-zA-Z0-9]/g, "")
            .substring(0, 8)
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

    async dispose(): Promise<void> {
        if (this.watcher) {
            await this.watcher.close()
            this.watcher = null
        }

        await this.prisma.$disconnect()
    }
}