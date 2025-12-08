import ffmpeg from "fluent-ffmpeg"
import { ffprobe, type FfprobeData } from '@dropb/ffprobe'
import fs from "fs"
import path from "path"
import { VideoMetadata } from "@/types/type"

export interface VideoResolution {
    width: number
    height: number
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
    private thumbDir: string

    constructor(filePath: string) {

        this.filePath = filePath
        
        this.thumbDir = path.join(process.cwd(), "public", "images", "thumbs")

        if (!fs.existsSync(this.thumbDir)) fs.mkdirSync(this.thumbDir, { recursive: true })

    }

    async getMetadata(): Promise<VideoMetadata> {

        const data: FfprobeData = await ffprobe(this.filePath)

        const videoStream = data.streams.find(s => s.codec_type === "video")
        const format = data.format

        if (!videoStream) throw new Error("No video stream found")
            
        return {
            width: videoStream.width,
            height: videoStream.height,
            duration: format.duration,
            bitrate: videoStream.bit_rate ?? format.bit_rate
        }
    }

    extractThumbnail(id: string, timeInSeconds: number = 2): Promise<string> {
        return new Promise((resolve, reject) => {
            // if (!fs.existsSync(path.join(this.thumbDir, `${id}.jpg`))) 
            ffmpeg(this.filePath)
                .on("end", () => resolve(this.thumbDir))
                .on("error", reject)
                .screenshots({
                    timestamps: [timeInSeconds],
                    filename: `${id}.jpg`,
                    folder: this.thumbDir
                })
        })
    }
}
