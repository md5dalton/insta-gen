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
    private userCache = new Map<string, any>()
    private tagCache = new Map<string, any>()

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
        const relativePath = filePath.replace(MEDIA_CONFIG.ROOT_PATH, "")

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
                const media = await this.prisma.media.create({
                    data: {
                        id,
                        path: relativePath,
                        type: isVideo ? "VIDEO" : "IMAGE",
                        ownerId: userId,
                        height: metadata.height,
                        width: metadata.width,
                        size: stats.size,
                        duration: isVideo ? metadata.duration : null,
                        mktime: String(stats.birthtimeMs)
                    }
                })
                
                if (media) {
                    this.setUserPicture(userId, media.id)
                    await this.processTags(id, userId, tags)
                }

                console.log(`✅ Processed: ${relativePath}`)

            } else {
                console.log(`❌ Failed to process media: ${relativePath}`)
            }


        } catch (err) {
            console.error(`❌ Failed: ${relativePath}`, err)
            throw err
        }

    }

    async handleDelete(filePath: string) {
        const id = this.generateId(filePath)

        await this.prisma.media.deleteMany({
            where: { id }
        })

        console.log(`🗑️ Deleted: ${basename(filePath)}`)
    }

    private async setUserPicture(userId: string, mediaId: string) {

        if (this.userCache.has(userId)) return

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                picture: true
            }
        })

        if (user && !user.picture) {

            await this.prisma.user.update({
                where: { id: userId },
                data: { picture: mediaId }
            })

            this.userCache.set(userId, user)

        }
    }
    private async processTags(mediaId: string, userId: string, tags: string[]) {
        
        for (let i = 0; i < tags.length; i++) {
            const tagPath = join(userId, ...tags.slice(0, i + 1))
            const tagName = tags[i]
            const id = this.generateId(tagPath)

            const tag = await this.prisma.tag.upsert({
                where: { id },
                update: { name: tagName },
                create: { name: tagName, id }
            })

            const mt = await this.prisma.mediaTag.create({
                data: {
                    id: this.generateId(`media-${mediaId}-tag-${tag.id}`),
                    mediaId,
                    tagId: tag.id
                }
            })

        }
    }

}