import { extname, join, sep } from "node:path"
import { AssetType, PrismaClient } from "@/prisma/generated/client"
import { generateId } from "@/lib/path"
import { Storage } from "@/lib/storage"
import { ImageProcessor } from "@/lib/imageProcessor"
import { VideoProcessor } from "@/lib/videoProcessor"
import { MediaConfig } from "@/lib/config"
import { logger } from "@/lib/logger"
import { DBcache } from "@/lib/DBcache"
import { updateMediaAsset } from "@/lib/db/admin/mediaAsset"
import { exists } from "@/lib/db/admin/media"

const CONFIG = MediaConfig

export class MediaService {
    private DBcache: DBcache
    private readonly storage: Storage

    private mediaRoot: string

    constructor(private prisma: PrismaClient) {
        this.DBcache = new DBcache()
        this.storage = new Storage(CONFIG.ASSETS_ROOT)

        this.mediaRoot = CONFIG.MEDIA_ROOT
    }

    async handleAdd(filePath: string) {

        const id = generateId(filePath)
        
        if ((await exists(id))) return
        
        const {
            relativePath,
            user,
            tags
        } = await this.resolveContext(filePath)

        const ext = extname(filePath).toLowerCase()
        const isVideo = CONFIG.VIDEO_EXTENSIONS.includes(ext)

        try {
            const stats = await this.storage.stat(filePath)
            let metadata: { width: number; height: number; duration?: string } | null = null

            if (isVideo) {
                const video = new VideoProcessor(this.storage, filePath, id)
                const result = await video.probe()

                const poster = await video.generatePoster()

                if (poster) await updateMediaAsset(id, poster, AssetType.THUMBNAIL)

                metadata = {
                    width: result.width,
                    height: result.height,
                    duration: result.duration,
                }
            } else {
                const image = new ImageProcessor(this.storage, filePath)
                const result = await image.probe()

                const thumb = await image.generateThumb()

                if (thumb) await updateMediaAsset(id, thumb, AssetType.THUMBNAIL)

                metadata = {
                    width: result.width,
                    height: result.height,
                }
            }

            if (metadata) {
                const media = await this.prisma.mediaItem.create({
                    data: {
                        id,
                        type: isVideo ? "VIDEO" : "IMAGE",
                        path: relativePath,
                        size: stats.size,
                        width: metadata.width,
                        height: metadata.height,
                        duration: isVideo ? Number(metadata.duration) : null,
                        mktime: stats.mtimeMs,
                        userId: user.id,
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
            // throw error
        }
    }

    async handleDelete(id: string) {
        const media = await this.prisma.mediaItem.delete({
            where: { id },
        })

        logger.info("Deleted watched media", { mediaId: id, path: media.path })
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

    private async resolveContext(directory: string) {
        const relativePath = directory.replace(this.mediaRoot, "")
        const parts = relativePath.split(sep).filter(Boolean)
        parts.pop()

        const tags = []

        const [root, col, usr] = parts

        const userPath = join(root, col, usr)

        for (let i = 0; i < parts.length; i++) {
            const tagPath = join(...parts.slice(0, i + 1))

            if (userPath !== tagPath) {
                const tag = await this.DBcache.ensureTag(tagPath)
                tags.push(tag.id)
            }
        }

        const {
            rootCollection,
            collection,
            user
        } = await this.DBcache.ensureParents(root, col, usr)

        return {
            relativePath,
            rootCollection,
            collection,
            user,
            tags
        }
    }

}
