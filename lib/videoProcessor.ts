import { mediaEngineConfig } from "./config"
import { Storage } from "./storage"
import { FFmpeg } from "./ffmpeg"
import { FFprobe } from "./ffprobe"
import { TranscodeError } from "./errors"
import { EventEmitter } from "node:events"

export interface VideoAssetMetadata {
    width: number
    height: number
    duration: string
}
type StoredVideoMetadata = {
    id: string
    width: number
    height: number
    duration: string | number
    createdAt: string
}

const VAAPI_DEVICE = process.env.VAAPI_DEVICE ?? "/dev/dri/renderD128"

export class VideoProcessor {
    private readonly storage: Storage
    private readonly path: string
    private readonly id: string
    private readonly ffmpeg: FFmpeg
    private readonly ffprobe: FFprobe

    /**
     * Prevent multiple requests in this Node process from generating
     * the same segment simultaneously.
     *
     * Key:
     *   videoId:segmentNumber
     */
    private static readonly segmentLocks = new Map<
        string,
        Promise<void>
    >()

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
        const hlsDirectory = `videos/${this.id}/hls/1080`

        await this.storage.mkdir(hlsDirectory)

        const probe = await this.ffprobe.probe(this.path)

        const videoStream = probe.streams.find(stream => stream.codec_type === "video")

        if (!videoStream?.width || !videoStream?.height) throw new TranscodeError("Unable to inspect video")

        const normalizedDimensions = this.normalizeDimensions(videoStream)

        const duration = Number(probe.format.duration ?? 0)

        const metadata = {
            id: this.id,
            width: normalizedDimensions.width,
            height: normalizedDimensions.height,
            duration: probe.format.duration ?? "0",
            createdAt: new Date().toISOString(),
        }

        /** Poster */
        if (!(await this.storage.exists(posterPath))) {
            const tempPosterRel = posterPath.replace(
                /\.webp$/,
                ".tmp.webp"
            )

            const tempPosterAbs = this.storage.resolve(tempPosterRel)

            const posterCommand = [
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

            await new Promise<void>((resolve, reject) => {
                const posterProcess = this.ffmpeg.run(posterCommand)

                posterProcess.once("end", async () => {
                    try {
                        await this.storage.move(
                            tempPosterRel,
                            posterPath
                        )

                        resolve()
                    } catch (error) {
                        reject(error)
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

        /* * Metadata */
        if (!(await this.storage.exists(metadataPath))) {
            await this.storage.saveFile(
                metadataPath,
                Buffer.from(
                    JSON.stringify(metadata, null, 2)
                )
            )
        }

        const firstSegmentPath = `${hlsDirectory}/segment000.ts`

        if (!(await this.storage.exists(firstSegmentPath))) {
            await this.generateStartupSegments()
        }

        /*
         * Master playlist
         *
         * This one is tiny and can remain static.
         */
        if (!(await this.storage.exists(masterPlaylistPath))) {
            await this.storage.saveFile(
                masterPlaylistPath,
                Buffer.from(
                    this.renderMasterPlaylist()
                )
            )
        }

        return {
            width: normalizedDimensions.width,
            height: normalizedDimensions.height,
            duration: metadata.duration,
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
        let width = videoStream.width ?? 0
        let height = videoStream.height ?? 0

        const rotation = Number(
            videoStream.tags?.rotate ??
                videoStream.side_data_list?.find(
                    (item) => item.rotation
                )?.rotation ??
                0
        )

        if ([90, -90, 270, -270].includes(rotation)) {
            ;[width, height] = [height, width]
        }

        return {
            width,
            height,
        }
    }

    /**
     * Generate the first few segments.
     *
     * FFmpeg owns the initial HLS playlist.
     */
    private async generateStartupSegments(): Promise<void> {
        const initialSegments = 3

        for (
            let segmentNumber = 0;
            segmentNumber < initialSegments;
            segmentNumber++
        ) {
            try {
                await this.generateSegment(segmentNumber)
            } catch (error) {
                // The video may be shorter than the initial
                // number of segments.
                if (error instanceof SegmentNotFoundError) {
                    break
                }

                throw error
            }
        }
    }
    /**
     * Generate one specific HLS segment.
     *
     * Example:
     *
     * segment 3
     *   start = 18
     *   duration = 6
     *
     * resulting file:
     *
     *   segment003.ts
     */
    async generateSegment(
        segmentNumber: number
    ): Promise<void> {
        if (
            !Number.isInteger(segmentNumber) ||
            segmentNumber < 0
        ) {
            throw new TranscodeError(
                "Invalid segment number"
            )
        }

        const lockKey =
            `${this.id}:${segmentNumber}`

        const existingLock =
            VideoProcessor.segmentLocks.get(lockKey)

        if (existingLock) {
            await existingLock
            return
        }

        const generation = this.generateSegmentLocked(
            segmentNumber
        )

        VideoProcessor.segmentLocks.set(
            lockKey,
            generation
        )

        try {
            await generation
        } finally {
            VideoProcessor.segmentLocks.delete(
                lockKey
            )
        }
    }

    private async generateSegmentLocked(
        segmentNumber: number
    ): Promise<void> {
        const segmentName =
            `segment${String(segmentNumber).padStart(3, "0")}.ts`

        const segmentPath =
            `videos/${this.id}/hls/1080/${segmentName}`

        /*
        * Double-check after acquiring the lock.
        */
        if (await this.storage.exists(segmentPath)) {
            return
        }

        const metadata =
            await this.readMetadata()

        const totalDuration =
            Number(metadata.duration)

        if (
            !Number.isFinite(totalDuration) ||
            totalDuration <= 0
        ) {
            throw new TranscodeError(
                "Invalid video duration"
            )
        }

        const segmentDuration =
            mediaEngineConfig.segmentDuration

        const start =
            segmentNumber * segmentDuration

        /*
        * Example with 6 second segments:
        *
        * segment000 -> 0s
        * segment001 -> 6s
        * segment002 -> 12s
        * segment003 -> 18s
        */
        if (start >= totalDuration) {
            throw new SegmentNotFoundError(
                "Segment is beyond the end of the video"
            )
        }

        /*
        * The final segment may be shorter than the
        * normal segment duration.
        */
        const duration =
            Math.min(
                segmentDuration,
                totalDuration - start
            )

        const tempPath =
            `${segmentPath}.tmp`

        const outputAbs =
            this.storage.resolve(tempPath)

        const command: string[] = [
            "ffmpeg",
            "-y",

            "-ss",
            String(start),

            "-i",
            this.path,

            "-t",
            String(duration),
        ]

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

        command.push(
            "-c:a",
            "aac",

            "-f",
            "mpegts",

            outputAbs
        )

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

            /*
            * Only move the file into its permanent
            * location after FFmpeg succeeded.
            */
            await this.storage.move(
                tempPath,
                segmentPath
            )
        } catch (error) {
            try {
                await this.storage.delete(
                    tempPath
                )
            } catch {}

            throw error
        }
    }

    async getAvailableSegments(): Promise<number[]> {
        const metadata =
            await this.readMetadata()

        const totalDuration =
            Number(metadata.duration)

        const segmentDuration =
            mediaEngineConfig.segmentDuration

        const totalSegments =
            Math.ceil(
                totalDuration /
                    segmentDuration
            )

        const available: number[] = []

        /*
        * HLS segments must be contiguous.
        *
        * If segment003 is missing, don't advertise
        * segment004 even if it happens to exist.
        */
        for (
            let i = 0;
            i < totalSegments;
            i++
        ) {
            const segmentPath =
                `videos/${this.id}/hls/1080/segment${String(
                    i
                ).padStart(3, "0")}.ts`

            if (
                !(await this.storage.exists(
                    segmentPath
                ))
            ) {
                break
            }

            available.push(i)
        }

        return available
    }

    async renderAvailablePlaylist(): Promise<string> {
        const metadata =
            await this.readMetadata()

        const totalDuration =
            Number(metadata.duration)

        const segmentDuration =
            mediaEngineConfig.segmentDuration

        const totalSegments =
            Math.ceil(
                totalDuration /
                    segmentDuration
            )

        const availableSegments =
            await this.getAvailableSegments()

        /*
        * Generate two segments ahead.
        */
        const lookAhead = 2

        const targetCount =
            Math.min(
                availableSegments.length +
                    lookAhead,
                totalSegments
            )

        for (
            let segmentNumber =
                availableSegments.length;
            segmentNumber < targetCount;
            segmentNumber++
        ) {
            await this.generateSegment(
                segmentNumber
            )
        }

        /*
        * Re-read after generation.
        */
        const segments =
            await this.getAvailableSegments()

        const lines = [
            "#EXTM3U",
            "#EXT-X-VERSION:3",
            `#EXT-X-TARGETDURATION:${Math.ceil(
                segmentDuration
            )}`,
            "#EXT-X-MEDIA-SEQUENCE:0",
        ]

        for (
            const segmentNumber of segments
        ) {
            const start =
                segmentNumber *
                segmentDuration

            const duration =
                Math.min(
                    segmentDuration,
                    totalDuration - start
                )

            if (duration <= 0) {
                break
            }

            lines.push(
                `#EXTINF:${duration.toFixed(6)},`,
                `segment${String(
                    segmentNumber
                ).padStart(3, "0")}.ts`
            )
        }

        if (
            segments.length >= totalSegments
        ) {
            lines.push("#EXT-X-ENDLIST")
        }

        lines.push("")

        return lines.join("\n")
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

    private async readMetadata(): Promise<StoredVideoMetadata> {
        const metadataPath =
            `videos/${this.id}/metadata.json`

        if (!(await this.storage.exists(metadataPath))) {
            throw new TranscodeError(
                "Video metadata not found"
            )
        }

        const content =
            await this.storage.readFile(metadataPath)

        try {
            return JSON.parse(
                content.toString()
            ) as StoredVideoMetadata
        } catch {
            throw new TranscodeError(
                "Invalid video metadata"
            )
        }
    }

    
}

export class SegmentNotFoundError extends Error {
    constructor(message = "Segment not found") {
        super(message)
        this.name = "SegmentNotFoundError"
    }
}
