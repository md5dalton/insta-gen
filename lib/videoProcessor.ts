import path from "node:path"
import sharp from "sharp"
import { mediaEngineConfig } from "./config"
import { Storage } from "./storage"
import { FFmpeg } from "./ffmpeg"
import { FFprobe } from "./ffprobe"
import { logger } from "./logger"
import { TranscodeError } from "./errors"

export interface VideoAssetMetadata {
  id: string
  originalPath: string
  posterPath: string
  metadataPath: string
  masterPlaylistPath: string
  variantPlaylistPath: string
  startupSegments: string[]
}

export class VideoProcessor {
  private readonly storage: Storage
  private readonly ffmpeg: FFmpeg
  private readonly ffprobe: FFprobe

  constructor(storage: Storage, ffmpeg = new FFmpeg(mediaEngineConfig.ffmpegTimeoutMs), ffprobe = new FFprobe()) {
    this.storage = storage
    this.ffmpeg = ffmpeg
    this.ffprobe = ffprobe
  }

  async process(inputRelativePath: string, id: string): Promise<VideoAssetMetadata> {
    const originalPath = `videos/${id}/original.mp4`
    const posterPath = `videos/${id}/poster.webp`
    const metadataPath = `videos/${id}/metadata.json`
    const masterPlaylistPath = `videos/${id}/hls/master.m3u8`
    const variantPlaylistPath = `videos/${id}/hls/1080/index.m3u8`
    const startupSegments = [`videos/${id}/hls/1080/segment000.ts`, `videos/${id}/hls/1080/segment001.ts`]

    await this.storage.mkdir(`videos/${id}/hls/1080`)
    await this.storage.copy(inputRelativePath, originalPath)

    const probe = await this.ffprobe.probe(this.storage.resolve(originalPath))
    const videoStream = probe.streams.find((stream) => stream.codec_type === "video")
    if (!videoStream?.width || !videoStream?.height) {
      throw new TranscodeError("Unable to inspect uploaded video")
    }

    await sharp(this.storage.resolve(originalPath), { failOnError: false }).resize({ width: 1920, height: 1080, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toFile(this.storage.resolve(posterPath))

    const metadata = {
      id,
      width: videoStream.width,
      height: videoStream.height,
      duration: probe.format.duration ?? "0",
      createdAt: new Date().toISOString(),
    }
    await this.storage.saveFile(metadataPath, Buffer.from(JSON.stringify(metadata, null, 2)))

    await this.generateStartupSegments(originalPath, id)

    await this.storage.saveFile(masterPlaylistPath, Buffer.from(this.renderMasterPlaylist(id)))
    await this.storage.saveFile(variantPlaylistPath, Buffer.from(this.renderVariantPlaylist(id)))

    logger.info("Generated video assets", { videoId: id })
    return {
      id,
      originalPath,
      posterPath,
      metadataPath,
      masterPlaylistPath,
      variantPlaylistPath,
      startupSegments,
    }
  }

  private async generateStartupSegments(originalPath: string, id: string): Promise<void> {
    const outputPattern = `videos/${id}/hls/1080/segment%03d.ts`
    const command = [
      "ffmpeg",
      "-y",
      "-i",
      this.storage.resolve(originalPath),
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-f",
      "hls",
      "-hls_time",
      String(mediaEngineConfig.segmentDuration),
      "-hls_list_size",
      "3",
      "-hls_segment_filename",
      this.storage.resolve(outputPattern),
      this.storage.resolve(`videos/${id}/hls/1080/index.m3u8`),
    ]

    const process = this.ffmpeg.run(command)
    await new Promise<void>((resolve, reject) => {
      process.once("end", () => resolve())
      process.once("error", (error) => reject(error))
    })
  }

  private renderMasterPlaylist(id: string): string {
    return [
      "#EXTM3U",
      "#EXT-X-VERSION:3",
      "#EXT-X-STREAM-INF:BANDWIDTH=1200000,RESOLUTION=1920x1080",
      `hls/1080/index.m3u8`,
      "",
    ].join("\n")
  }

  private renderVariantPlaylist(id: string): string {
    return [
      "#EXTM3U",
      "#EXT-X-VERSION:3",
      "#EXT-X-TARGETDURATION:6",
      "#EXT-X-MEDIA-SEQUENCE:0",
      "#EXTINF:6.000000,",
      "segment000.ts",
      "#EXTINF:6.000000,",
      "segment001.ts",
      "",
    ].join("\n")
  }
}
