import { extname, basename, join } from "path"
import sharp from "sharp"
import { stat } from "fs/promises"
import crypto from "crypto"
import { PrismaClient } from "@/prisma/generated/client"
import { DIR_THUMB, MEDIA_CONFIG } from "@/config/media"
import { Video } from "./video.service"

const VIDEO_EXTENSIONS = MEDIA_CONFIG.VIDEO_EXTENSIONS

let activeVideos = 0
const MAX_VIDEO_CONCURRENCY = 2

export class MediaService {
    constructor(private prisma: PrismaClient) {}

    private generateId(path: string) {
        const hash = crypto.createHash("sha256").update(path).digest("hex")
        return Buffer.from(hash, "hex").toString("base64")
            .replace(/[^a-zA-Z0-9]/g, "")
            .substring(0, 8)
    }

    private async waitForVideoSlot() {
        while (activeVideos >= MAX_VIDEO_CONCURRENCY) {
            await new Promise(r => setTimeout(r, 500))
        }
        activeVideos++
    }

    private releaseVideoSlot() {
        activeVideos--
    }

    async handleAddOrChange(filePath: string, userId: string, tags: string[]) {
        const id = this.generateId(filePath)

        // ✅ DEDUPE: skip if exists
        const exists = await this.prisma.media.findUnique({ where: { id } })
        if (exists) return

        const ext = extname(filePath).toLowerCase()
        const isVideo = VIDEO_EXTENSIONS.includes(ext)

        try {
            let metadata: any
            const stats = await stat(filePath)

            if (isVideo) {
                await this.waitForVideoSlot()

                try {
                    const video = new Video(filePath)
                    metadata = await video.getMetadata()

                    if (metadata) {
                        await video.extractThumbnail(id) // heavy
                    }
                } finally {
                    this.releaseVideoSlot()
                }

            } else {
                const image = sharp(filePath)
                await image.resize(320).toFile(join(DIR_THUMB, `${id}.jpg`))
                metadata = await image.metadata()
            }

            if (metadata) {
                await this.prisma.media.create({
                    data: {
                        id,
                        path: filePath,
                        type: isVideo ? "VIDEO" : "IMAGE",
                        ownerId: userId,
                        height: metadata.height,
                        width: metadata.width,
                        size: stats.size,
                        duration: isVideo ? metadata.duration : null,
                        mktime: String(stats.birthtimeMs)
                    }
                })
    
                console.log(`✅ Processed: ${basename(filePath)}`)

            } else {
                console.log(`❌ Failed to process media: ${basename(filePath)}`)
            }


        } catch (err) {
            console.error(`❌ Failed: ${filePath}`, err)
            throw err
        }

        await this.processTags(id, userId, tags)
    }

    async handleDelete(filePath: string) {
        const id = this.generateId(filePath)

        await this.prisma.media.deleteMany({
            where: { id }
        })

        console.log(`🗑️ Deleted: ${basename(filePath)}`)
    }

    private async processTags(mediaId: string, userId: string, tags: string[]) {
        // simplified tagging
    }
}