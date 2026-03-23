import ffmpeg from "fluent-ffmpeg"
import { ffprobe, type FfprobeData } from '@dropb/ffprobe'
import fs from "fs"
import path from "path"
import { VideoMetadata } from "@/types/type"
import { DIR_THUMB } from "@/config/media"

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
        
        this.thumbDir = DIR_THUMB

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
    
    extractThumbnail(id: string, timeInSeconds: number = 1): Promise<string> {
        return new Promise((resolve, reject) => {
            const outputPath = path.join(this.thumbDir, `${id}.jpg`)
            const tempPath = path.join(this.thumbDir, `${id}.tmp.jpg`)

            // Fast path: already exists
            if (fs.existsSync(outputPath)) {
                return resolve(outputPath)
            }

            ffmpeg(this.filePath)
                .on("end", () => {
                    try {
                        // Atomic rename (safe replace)
                        fs.renameSync(tempPath, outputPath)
                        resolve(outputPath)
                    } catch (err) {
                        reject(err)
                    }
                })
                .on("error", (err) => {
                    // Cleanup temp file if something failed
                    if (fs.existsSync(tempPath)) {
                        fs.unlinkSync(tempPath)
                    }
                    reject(err)
                })
                .screenshots({
                    count: 1,
                    filename: path.basename(tempPath),
                    folder: this.thumbDir
                })
        })
    }
}
