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

const VAAPI_DEVICE =
    process.env.VAAPI_DEVICE ??
    "/dev/dri/renderD128"

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
        ffmpeg = new FFmpeg(
            mediaEngineConfig.ffmpegTimeoutMs
        ),
        ffprobe = new FFprobe()
    ) {
        this.storage = storage
        this.path = path
        this.id = id
        this.ffmpeg = ffmpeg
        this.ffprobe = ffprobe
    }
    
    async process(): Promise<VideoAssetMetadata> {
        const posterPath =
            `videos/${this.id}/poster.webp`

        const metadataPath =
            `videos/${this.id}/metadata.json`

        const masterPlaylistPath =
            `videos/${this.id}/hls/master.m3u8`

        const hlsDirectory =
            `videos/${this.id}/hls/1080`

        await this.storage.mkdir(
            hlsDirectory
        )

        const probe =
            await this.ffprobe.probe(this.path)

        const videoStream =
            probe.streams.find(
                stream =>
                    stream.codec_type === "video"
            )

        if (
            !videoStream?.width ||
            !videoStream?.height
        ) {
            throw new TranscodeError(
                "Unable to inspect video"
            )
        }

        const normalizedDimensions =
            this.normalizeDimensions(
                videoStream
            )

        const metadata = {
            id: this.id,
            width:
                normalizedDimensions.width,
            height:
                normalizedDimensions.height,
            duration:
                probe.format.duration ?? "0",
            createdAt:
                new Date().toISOString(),
        }

        if (
            !(await this.storage.exists(
                posterPath
            ))
        ) {
            await this.generatePoster(
                posterPath
            )
        }

        if (
            !(await this.storage.exists(
                metadataPath
            ))
        ) {
            await this.storage.saveFile(
                metadataPath,
                Buffer.from(
                    JSON.stringify(
                        metadata,
                        null,
                        2
                    )
                )
            )
        }

        /*
        * Process the ENTIRE video.
        *
        * Generates all .ts segments and
        * the complete index.m3u8.
        */
        await this.generateHls()

        /*
        * Generate master playlist.
        */
        if (
            !(await this.storage.exists(
                masterPlaylistPath
            ))
        ) {
            await this.storage.saveFile(
                masterPlaylistPath,
                Buffer.from(
                    this.renderMasterPlaylist()
                )
            )
        }

        return {
            width:
                normalizedDimensions.width,
            height:
                normalizedDimensions.height,
            duration:
                metadata.duration,
        }
    }

    private normalizeDimensions(
        videoStream: {
            width?: number
            height?: number
            tags?: Record<string, string>
            side_data_list?: Array<{
                rotation?: string
            }>
        }
    ): {
        width: number
        height: number
    } {
        let width =
            videoStream.width ?? 0

        let height =
            videoStream.height ?? 0

        const rotation =
            Number(
                videoStream.tags?.rotate ??
                    videoStream.side_data_list?.find(
                        item =>
                            item.rotation
                    )?.rotation ??
                    0
            )

        if (
            [90, -90, 270, -270]
                .includes(rotation)
        ) {
            ;[width, height] =
                [height, width]
        }

        return {
            width,
            height,
        }
    }

    private async generatePoster(
        posterPath: string
    ): Promise<void> {
        const tempPosterRel =
            posterPath.replace(
                /\.webp$/,
                ".tmp.webp"
            )

        const tempPosterAbs =
            this.storage.resolve(
                tempPosterRel
            )

        const command = [
            "ffmpeg",
            "-y",

            "-ss",
            "1",

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

        const process =
            this.ffmpeg.run(command)

        try {
            await new Promise<void>(
                (resolve, reject) => {
                    process.once(
                        "end",
                        resolve
                    )

                    process.once(
                        "error",
                        reject
                    )
                }
            )

            await this.storage.move(
                tempPosterRel,
                posterPath
            )
        } catch (error) {
            try {
                await this.storage.delete(
                    tempPosterRel
                )
            } catch {}

            throw error
        }
    }

    private async generateHls(): Promise<void> {
        const outputDir =
            `videos/${this.id}/hls/1080`

        const playlistPath =
            `${outputDir}/index.m3u8`

        const segmentPattern =
            `${outputDir}/segment%03d.ts`

        const playlistAbs =
            this.storage.resolve(
                playlistPath
            )

        const segmentPatternAbs =
            this.storage.resolve(
                segmentPattern
            )

        const duration =
            mediaEngineConfig.segmentDuration

        const command: string[] = [
            "ffmpeg",
            "-y",

            "-i",
            this.path,
        ]

        /*
        * Video.
        */
        if (mediaEngineConfig.gpuEnabled) {
            command.push(
                "-vaapi_device",
                VAAPI_DEVICE,

                "-vf",
                "format=nv12,hwupload",

                "-c:v",
                "h264_vaapi",

                "-qp",
                "23"
            )
        } else {
            command.push(
                "-c:v",
                "libx264",

                "-preset",
                "veryfast",

                "-crf",
                "23"
            )
        }

        /*
        * Audio + complete HLS VOD.
        */
        command.push(
            "-c:a",
            "aac",

            "-f",
            "hls",

            "-hls_time",
            String(duration),

            /*
            * 0 means keep ALL segments in
            * the playlist.
            */
            "-hls_list_size",
            "0",

            /*
            * Generate every segment:
            *
            * segment000.ts
            * segment001.ts
            * segment002.ts
            * ...
            */
            "-hls_segment_filename",
            segmentPatternAbs,

            /*
            * Complete playlist.
            */
            playlistAbs
        )

        console.log(
            `[VideoProcessor] Generating complete HLS for ${this.id}`
        )

        const process =
            this.ffmpeg.run(command)

        await new Promise<void>(
            (resolve, reject) => {
                process.once(
                    "end",
                    resolve
                )

                process.once(
                    "error",
                    reject
                )
            }
        )

        console.log(
            `[VideoProcessor] Complete HLS generated for ${this.id}`
        )
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
}