import sharp from "sharp"
import { mediaEngineConfig } from "./config"
import { Storage } from "./storage"

export interface ImageAssetMetadata {
    width: number
    height: number
}

export class ImageProcessor {
    constructor(private readonly storage: Storage) {}

    async process(path: string, id: string): Promise<ImageAssetMetadata> {
        const feedPath = `images/${id}/feed.webp`
        const thumbPath = `images/${id}/thumb.webp`

        await this.storage.mkdir(`images/${id}`)

        const image = sharp(path)
        const metadata = await image.metadata()
        let width = metadata.width ?? 0
        let height = metadata.height ?? 0

        // normalize dimensions based on EXIF orientation so stored values match the rendered image
        if ([5, 6, 7, 8].includes(Number(metadata.orientation))) {
            ;[width, height] = [height, width]
        }

        if (!(await this.storage.exists(feedPath))) {
            await image
                .rotate()
                .resize({
                    width: mediaEngineConfig.feedWidth,
                    height: mediaEngineConfig.feedWidth,
                    fit: "inside",
                    withoutEnlargement: true,
                })
                .webp({ quality: mediaEngineConfig.feedQuality })
                .toFile(this.storage.resolve(feedPath))
        }

        if (!(await this.storage.exists(thumbPath))) {
            await sharp(path)
                .rotate()
                .resize({
                    width: mediaEngineConfig.thumbWidth,
                    height: mediaEngineConfig.thumbWidth,
                    fit: "inside",
                    withoutEnlargement: true,
                })
                .webp({ quality: mediaEngineConfig.thumbQuality })
                .toFile(this.storage.resolve(thumbPath))
        }

        return {
            width,
            height,
        }
    }
}
