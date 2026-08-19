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

        const image = sharp(path, { failOnError: false })
        const metadata = await image.metadata()
        const width = metadata.width ?? 0
        const height = metadata.height ?? 0

        await image
            .rotate()
            .resize({ width: mediaEngineConfig.feedWidth, height: mediaEngineConfig.feedWidth, fit: "inside", withoutEnlargement: true })
            .webp({ quality: mediaEngineConfig.feedQuality })
            .toFile(this.storage.resolve(feedPath))

        await sharp(path, { failOnError: false })
            .rotate()
            .resize({ width: mediaEngineConfig.thumbWidth, height: mediaEngineConfig.thumbWidth, fit: "inside", withoutEnlargement: true })
            .webp({ quality: mediaEngineConfig.thumbQuality })
            .toFile(this.storage.resolve(thumbPath))

        return {
            width,
            height,
        }
    }
}
