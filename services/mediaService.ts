import { extname, basename, join } from "path"
import { stat } from "fs/promises"
import { PrismaClient } from "@/prisma/generated/client"
import { MEDIA_CONFIG } from "@/config/media"
import { Video } from "@/lib/video"
import { generateId } from "@/lib/path"
import { generateThumbnail, getMetadata } from "@/lib/image"

const VIDEO_EXTENSIONS = MEDIA_CONFIG.VIDEO_EXTENSIONS

let activeVideos = 0
const MAX_VIDEO_CONCURRENCY = 1

export class MediaService {
    private userCache = new Map<string, any>()
    private tagCache = new Map<string, any>()

    constructor(private prisma: PrismaClient) {}

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
        const id = generateId(filePath)

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

                await generateThumbnail(filePath)

                metadata = await getMetadata(filePath)

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
        const id = generateId(filePath)

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
            const id = generateId(tagPath)

            const tag = await this.prisma.tag.upsert({
                where: { id },
                update: { name: tagName },
                create: { name: tagName, id }
            })

            await this.prisma.mediaTag.create({
                data: {
                    id: generateId(`media-${mediaId}-tag-${tag.id}`),
                    mediaId,
                    tagId: tag.id
                }
            })

        }
    }

}