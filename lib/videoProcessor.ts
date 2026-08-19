import { mediaEngineConfig } from "./config"
import { Storage } from "./storage"
import { FFmpeg } from "./ffmpeg"
import { FFprobe } from "./ffprobe"
import { TranscodeError } from "./errors"

export interface VideoAssetMetadata {
    width: number
    height: number
    duration: string
}

const VAAPI_DEVICE = process.env.VAAPI_DEVICE ?? "/dev/dri/renderD128"

export class VideoProcessor {
    private readonly storage: Storage
    private readonly path: string
    private readonly id: string
    private readonly ffmpeg: FFmpeg
    private readonly ffprobe: FFprobe

    constructor(
        storage: Storage,
        path: string,
        id: string,
        ffmpeg = new FFmpeg(mediaEngineConfig.ffmpegTimeoutMs),
        ffprobe = new FFprobe()
    ) {
        this.storage = storage
        this.path = path
        this.id = id
        this.ffmpeg = ffmpeg
        this.ffprobe = ffprobe
    }

  async process(): Promise<VideoAssetMetadata> {
        const posterPath = `videos/${this.id}/poster.webp`
        const metadataPath = `videos/${this.id}/metadata.json`
        const masterPlaylistPath = `videos/${this.id}/hls/master.m3u8`
        const variantPlaylistPath = `videos/${this.id}/hls/1080/index.m3u8`

        await this.storage.mkdir(`videos/${this.id}/hls/1080`)

        const probe = await this.ffprobe.probe(this.path)
        const videoStream = probe.streams.find((stream) => stream.codec_type === "video")

        if (!videoStream?.width || !videoStream?.height) throw new TranscodeError("Unable to inspect video")

        const normalizedDimensions = this.normalizeDimensions(videoStream)

        const tempPosterRel = posterPath.replace(/\.webp$/, ".tmp.webp")
        const tempPosterAbs = this.storage.resolve(tempPosterRel)

        const posterCommand = [
            "ffmpeg",
            "-y",
            "-ss",
            String(1),
            "-i",
            this.path,
            "-vframes",
            "1",
            "-vf",
            "scale=1920:1080:force_original_aspect_ratio=decrease",
            "-q:v",
            "82",
            tempPosterAbs,
        ]

        const metadata = {
            id: this.id,
            width: normalizedDimensions.width,
            height: normalizedDimensions.height,
            duration: probe.format.duration ?? "0",
            createdAt: new Date().toISOString(),
        }

        if (!(await this.storage.exists(posterPath))) {
            await new Promise<void>((resolve, reject) => {
                const posterProcess = this.ffmpeg.run(posterCommand)

                posterProcess.once("end", async () => {
                    try {
                        await this.storage.move(tempPosterRel, posterPath)
                        resolve()
                    } catch (err) {
                        reject(err)
                    }
                })

                posterProcess.once("error", async (error) => {
                    try {
                        await this.storage.delete(tempPosterRel)
                    } catch {}
                    reject(error)
                })
            })
        }

        if (!(await this.storage.exists(metadataPath))) {
            await this.storage.saveFile(metadataPath, Buffer.from(JSON.stringify(metadata, null, 2)))
        }

        if (!(await this.storage.exists(masterPlaylistPath)) || !(await this.storage.exists(variantPlaylistPath))) {
            await this.generateStartupSegments()
            await this.storage.saveFile(masterPlaylistPath, Buffer.from(this.renderMasterPlaylist()))
            await this.storage.saveFile(variantPlaylistPath, Buffer.from(this.renderVariantPlaylist()))
        }

        return {
            width: normalizedDimensions.width,
            height: normalizedDimensions.height,
            duration: metadata.duration,
        }
  }

    private normalizeDimensions(videoStream: { width?: number; height?: number; tags?: Record<string, string>; side_data_list?: Array<{ rotation?: string }> }): { width: number; height: number } {
        let width = videoStream.width ?? 0
        let height = videoStream.height ?? 0

        const rotation = Number(
            videoStream.tags?.rotate ??
            videoStream.side_data_list?.find((item) => item.rotation)?.rotation ??
            0
        )

        if ([90, -90, 270, -270].includes(rotation)) {
            [width, height] = [height, width]
        }

        return { width, height }
    }

    private async generateStartupSegments(): Promise<void> {
        const outputPattern = `videos/${this.id}/hls/1080/segment%03d.ts`
        const initialSegments = 3 // generate 2 or 3 segments up front (configurable)

        let command: string[]

        if (mediaEngineConfig.gpuEnabled) {
            // Use VA-API hardware encoder (h264_vaapi) and limit processing time so ffmpeg exits
            command = [
                "ffmpeg",
                "-y",
                "-vaapi_device",
                VAAPI_DEVICE,
                "-i",
                this.path,
                "-t",
                String(mediaEngineConfig.segmentDuration * initialSegments),
                "-vf",
                "format=nv12,hwupload",
                "-c:v",
                "h264_vaapi",
                "-qp",
                "23",
                "-c:a",
                "aac",
                "-f",
                "hls",
                "-hls_time",
                String(mediaEngineConfig.segmentDuration),
                "-hls_list_size",
                String(initialSegments),
                "-hls_segment_filename",
                this.storage.resolve(outputPattern),
                this.storage.resolve(`videos/${this.id}/hls/1080/index.m3u8`),
            ]
        } else {
            command = [
                "ffmpeg",
                "-y",
                "-i",
                this.path,
                // limit processing to the first N segments worth of duration so ffmpeg exits
                "-t",
                String(mediaEngineConfig.segmentDuration * initialSegments),
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
                String(initialSegments),
                "-hls_segment_filename",
                this.storage.resolve(outputPattern),
                this.storage.resolve(`videos/${this.id}/hls/1080/index.m3u8`),
            ]
        }

        const process = this.ffmpeg.run(command)

        await new Promise<void>((resolve, reject) => {
            process.once("end", () => resolve())
            process.once("error", (error) => reject(error))
        })
    }

    private renderMasterPlaylist(): string {
            return [
                "#EXTM3U",
                "#EXT-X-VERSION:3",
                "#EXT-X-STREAM-INF:BANDWIDTH=1200000,RESOLUTION=1920x1080",
                "hls/1080/index.m3u8",
                "",
            ].join("\n")
    }

    private renderVariantPlaylist(): string {
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
