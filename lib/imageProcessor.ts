import sharp from "sharp"
import { mediaEngineConfig } from "./config"
import { Storage } from "./storage"
import { logger } from "./logger"

export interface ImageAssetMetadata {
  id: string
  originalPath: string
  feedPath: string
  thumbPath: string
}

export class ImageProcessor {
  constructor(private readonly storage: Storage) {}

  async process(inputRelativePath: string, id: string): Promise<ImageAssetMetadata> {
    const originalPath = `images/${id}/original`
    const feedPath = `images/${id}/feed.webp`
    const thumbPath = `images/${id}/thumb.webp`

    await this.storage.mkdir(`images/${id}`)
    await this.storage.copy(inputRelativePath, originalPath)

    const image = sharp(this.storage.resolve(originalPath), { failOnError: false })
    const metadata = await image.metadata()
    const width = metadata.width ?? 0
    const height = metadata.height ?? 0

    await image
      .rotate()
      .resize({ width: mediaEngineConfig.feedWidth, height: mediaEngineConfig.feedWidth, fit: "inside", withoutEnlargement: true })
      .webp({ quality: mediaEngineConfig.feedQuality })
      .toFile(this.storage.resolve(feedPath))

    await sharp(this.storage.resolve(originalPath), { failOnError: false })
      .rotate()
      .resize({ width: mediaEngineConfig.thumbWidth, height: mediaEngineConfig.thumbWidth, fit: "inside", withoutEnlargement: true })
      .webp({ quality: mediaEngineConfig.thumbQuality })
      .toFile(this.storage.resolve(thumbPath))

    logger.info("Generated image assets", { imageId: id, width, height })

    return {
      id,
      originalPath,
      feedPath,
      thumbPath,
    }
  }
}
