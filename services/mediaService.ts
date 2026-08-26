import { extname } from "node:path"
import { PrismaClient } from "@/prisma/generated/client"
import { generateId } from "@/lib/path"
import { File } from "@/types/type"
import { Storage } from "@/lib/storage"
import { ImageProcessor } from "@/lib/imageProcessor"
import { VideoProcessor } from "@/lib/videoProcessor"
import { MediaConfig } from "@/lib/config"
import { logger } from "@/lib/logger"

const CONFIG = MediaConfig

export class MediaService {
    private userCache = new Map<string, unknown>()
    private readonly storage: Storage

    constructor(private prisma: PrismaClient) {
        this.storage = new Storage(CONFIG.ASSETS_ROOT)
    }

    async handleAddOrChange(file: File, userId: string, tags: string[]) {
        const { id, path } = file
        const ext = extname(path).toLowerCase()
        const isVideo = CONFIG.VIDEO_EXTENSIONS.includes(ext)
        const relativePath = path.replace(CONFIG.MEDIA_ROOT, "").replace(/^\/+/, "")

        try {
            const stats = await this.storage.stat(path)
            let metadata: { width: number; height: number; duration?: string } | null = null

            if (isVideo) {
                const video = new VideoProcessor(this.storage, path, id)
                const result = await video.process()
                metadata = {
                    width: result.width,
                    height: result.height,
                    duration: result.duration,
                }
            } else {
                const image = new ImageProcessor(this.storage)
                const result = await image.process(path, id)
                metadata = {
                    width: result.width,
                    height: result.height,
                }
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
                        mktime: String(Date.now()),
                    },
                })

                if (media) await this.processTags(id, tags)

                logger.info("Processed watched media", { mediaId: id, path: relativePath })
            }
        } catch (error) {
            logger.error("Failed processing watched media", {
                mediaId: id,
                path: relativePath,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    async handleDelete(id: string) {
        const media = await this.prisma.media.delete({
            where: { id },
        })

        logger.info("Deleted watched media", { mediaId: id, path: media.path })
    }

    private async setUserPicture(userId: string, mediaId: string) {
        if (this.userCache.has(userId)) return

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                picture: true,
            },
        })

        if (user && !user.picture) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { picture: mediaId },
            })

            this.userCache.set(userId, user)
        }
    }

    private async processTags(mediaId: string, tags: string[]) {
        await Promise.all(
            tags.map(async (tagId) => {
                await this.prisma.mediaTag.create({
                    data: {
                        id: generateId(`media-${mediaId}-tag-${tagId}`),
                        mediaId,
                        tagId,
                    },
                })
            })
        )
    }
}
