import ffmpeg from "fluent-ffmpeg"
import { ffprobe, type FfprobeData } from '@dropb/ffprobe'
import fs from "fs"
import path from "path"

export interface VideoResolution {
    width: number
    height: number
}
export interface VideoMetadata {
    width: number
    height: number
    duration: string
}

export interface AudioInfo {
    codec: string
    channels: number
    sampleRate: number
}

export interface FullMetadata {
    duration: number
    width: number
    height: number
    hasAudio: boolean
    audio?: AudioInfo
}

export interface ThumbnailOptions {
    atSecond?: number
    outputDir: string
    outputName?: string
}

export class Video {
    private filePath: string

    constructor(filePath: string) {
        this.filePath = filePath
    }

    async getMetadata(): Promise<VideoMetadata> {

        const data: FfprobeData = await ffprobe(this.filePath)

        const videoStream = data.streams.find(s => s.codec_type === "video")
        const format = data.format

        if (!videoStream) throw new Error("No video stream found")

        return {
            width: videoStream.width,
            height: videoStream.height,
            duration: format.duration
        }
    }

    extractThumbnail(id: string, outputDir: string, timeInSeconds: number = 2): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(path.join(outputDir, `${id}.jpg`))) ffmpeg(this.filePath)
                .on("end", () => resolve(outputDir))
                .on("error", reject)
                .screenshots({
                    timestamps: [timeInSeconds],
                    filename: `${id}.jpg`,
                    folder: outputDir
                })
        })
    }
}
