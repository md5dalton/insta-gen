import { extname } from "path"
import { stat } from "fs/promises"
import { PrismaClient } from "@/prisma/generated/client"
import { MEDIA_CONFIG } from "@/config/media"
import { Video } from "@/lib/video"
import { generateId } from "@/lib/path"
import { generateThumbnail, getMetadata } from "@/lib/image"
import { File } from "@/types/type"

const VIDEO_EXTENSIONS = MEDIA_CONFIG.VIDEO_EXTENSIONS

export class MediaService {
    private userCache = new Map<string, any>()

    constructor(private prisma: PrismaClient) {}

    async handleAddOrChange(file: File, userId: string, tags: string[]) {
        const { id, path } = file

        const ext = extname(path).toLowerCase()
        const isVideo = VIDEO_EXTENSIONS.includes(ext)
        const relativePath = path.replace(MEDIA_CONFIG.ROOT_PATH, "")

        try {
            let metadata: any
            const stats = await stat(path)

            if (isVideo) {
                const video = new Video(path)
                metadata = await video.getMetadata()

                if (metadata) await video.extractThumbnail(id)

            } else {

                await generateThumbnail(path)

                metadata = await getMetadata(path)

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
                    await this.processTags(id, tags)
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

    async handleDelete(id: string) {

        const media = await this.prisma.media.delete({
            where: { id }
        })

        console.log(`🗑️ Deleted: ${id} -> ${media.path}`)
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
    
    private async processTags(mediaId: string, tags: string[]) {
        tags.forEach(async (tagId) => {
            await this.prisma.mediaTag.create({
                data: {
                    id: generateId(`media-${mediaId}-tag-${tagId}`),
                    mediaId,
                    tagId
                }
            })
        })
    }

}