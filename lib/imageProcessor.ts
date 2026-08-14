import path from "node:path"
import sharp from "sharp"
import { mediaEngineConfig } from "./config"
import { Storage } from "./storage"
import { logger } from "./logger"

export interface ImageAssetMetadata {
  id: string
  originalPath: string
  feedPath: string
  thumbPath: string
  width: number
  height: number
}

export class ImageProcessor {
  constructor(private readonly storage: Storage) {}

  async process(inputPath: string, id: string): Promise<ImageAssetMetadata> {
    const sourcePath = path.isAbsolute(inputPath) ? inputPath : this.storage.resolve(inputPath)
    const feedPath = `images/${id}/feed.webp`
    const thumbPath = `images/${id}/thumb.webp`

    await this.storage.mkdir(`images/${id}`)

    const image = sharp(sourcePath, { failOnError: false })
    const metadata = await image.metadata()
    const width = metadata.width ?? 0
    const height = metadata.height ?? 0

    await image
      .rotate()
      .resize({ width: mediaEngineConfig.feedWidth, height: mediaEngineConfig.feedWidth, fit: "inside", withoutEnlargement: true })
      .webp({ quality: mediaEngineConfig.feedQuality })
      .toFile(this.storage.resolve(feedPath))

    await sharp(sourcePath, { failOnError: false })
      .rotate()
      .resize({ width: mediaEngineConfig.thumbWidth, height: mediaEngineConfig.thumbWidth, fit: "inside", withoutEnlargement: true })
      .webp({ quality: mediaEngineConfig.thumbQuality })
      .toFile(this.storage.resolve(thumbPath))

    logger.info("Generated image assets", { imageId: id, width, height })

    return {
      id,
      originalPath: sourcePath,
      feedPath,
      thumbPath,
      width,
      height,
    }
  }
}
