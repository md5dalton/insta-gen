import { extname } from "path"
import chokidar, { FSWatcher } from "chokidar"
import prisma from "@/lib/prisma"
import { PrismaClient } from "@/prisma/generated/client"

export type FileUpdate = {
    event: "add" | "change" | "delete"
    timestamp: number
    file: { path: string }
}

export interface File {
    path: string
    // id: string
}

export interface Payload {
    file: File
    event: "add" | "change" | "delete"
    // userId: string
    // tags: string[]
}

export default class Watcher {
    private root: string
    private watcher: FSWatcher | null
    private exts = new Set<string>()
    private prisma: PrismaClient

    public pendingUpdates: Map<string, FileUpdate>

    files: string[] = []

    constructor(mediaRoot: string, extensions: string[]) {
        this.root = mediaRoot
        this.watcher = null
        this.pendingUpdates = new Map()
        this.prisma = prisma

        this.exts = new Set(extensions)
    }

    async initialize(ignoreInitial: boolean = false): Promise<void> {
        console.log("🔄 Initializing watcher...")

        this.watcher = chokidar.watch(this.root, {
            ignored: /(^|[\/\\])\../,
            persistent: true,
            ignoreInitial,
            depth: 10
        })

        this.watcher
            .on("add", (filePath) => this.queueUpdate("add", filePath))
            .on("change", (filePath) => this.queueUpdate("change", filePath))
            .on("unlink", (filePath) => this.queueUpdate("delete", filePath))

            
        console.log("✅ Watcher ready")
    }

    private async queueUpdate(event: FileUpdate["event"], filepath: string) {
        const ext = extname(filepath).toLowerCase()

        if (!this.exts.has(ext)) return

        await this.enqueueMediaJob({
            event,
            file: { path: filepath },
            // timestamp: Date.now()
        })

    }

    private async enqueueMediaJob({ file, event }: Payload) {
    
        const dedupeKey = `${event}:${file.path}`
    
        try {
            await this.prisma.job.create({
                data: {
                    type: "media",
                    payload: {...file, ...{event}},
                    dedupeKey
                }
            })
            
        } catch {
            // console.count("error")
            // duplicate job → ignore
        }
    }

    async dispose(): Promise<void> {
        if (this.watcher) {
            await this.watcher.close()
            this.watcher = null
        }

        await this.prisma.$disconnect()
    }
}
