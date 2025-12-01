import ffprobe from "@ffprobe-installer/ffprobe"
import Ffmpeg from "fluent-ffmpeg"
import staticffpeg from "ffmpeg-static"
import staticffprobe from "ffmpeg-static"

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

// Ffmpeg.setFfprobePath(ffprobe.path)

Ffmpeg.setFfprobePath("c:/ffmpeg/bin/ffmpeg")
// console.log(Ffmpeg.ffprobe.toString())
export class Video {
    private filePath: string

    constructor(filePath: string) {
        this.filePath = filePath
    }

    private probe(): Promise<Ffmpeg.FfprobeData> {
        return new Promise((resolve, reject) => {
            Ffmpeg.ffprobe(this.filePath, (err, data) => {
                if (err) reject(err)
                else resolve(data)
            })
        })
    }

    getResolution = () => new Promise((resolve, reject) => {
        
        Ffmpeg.ffprobe(this.filePath, (err, metadata) => {
        
            if (err) return reject(err)

            console.log(metadata)
            // const videoStream = metadata.streams.find(stream => stream.codec_type === "video")
            
            // if (!videoStream) return reject(new Error("No video stream found"))

            // const { width, height } = videoStream

            // resolve({ width, height })
        
        })
    })

    async getResolutions(): Promise<VideoResolution> {
        const metadata = await this.probe()

        const video = metadata.streams.find(s => s.codec_type === "video")

        if (!video?.width || !video?.height) throw new Error("No valid video stream found")

        return {
            width: video.width,
            height: video.height
        }
    }

    async getDuration(): Promise<number> {
        const metadata = await this.probe()

        const dur = metadata.format.duration
        if (!dur) throw new Error("Duration not found")

        return dur
    }

    // async getAudioInfo(): Promise<AudioInfo | null> {
    //     const metadata = await this.probe()

    //     const audio = metadata.streams.find(s => s.codec_type === "audio");
    //     if (!audio) return null;

    //     return {
    //         codec: audio.codec_name ?? "unknown",
    //         channels: audio.channels ?? 0,
    //         sampleRate: audio.sample_rate ? parseInt(audio.sample_rate, 10) : 0
    //     };
    // }

    // --- Combined metadata ---
    // async getFullMetadata(): Promise<FullMetadata> {
    //     const metadata = await this.probe();

    //     const video = metadata.streams.find(s => s.codec_type === "video");
    //     if (!video) throw new Error("Video stream not found");

    //     const audio = metadata.streams.find(s => s.codec_type === "audio");

    //     return {
    //         duration: metadata.format.duration ?? 0,
    //         width: video.width ?? 0,
    //         height: video.height ?? 0,
    //         hasAudio: !!audio,
    //         audio: audio
    //             ? {
    //                   codec: audio.codec_name ?? "unknown",
    //                   channels: audio.channels ?? 0,
    //                   sampleRate: audio.sample_rate
    //                       ? parseInt(audio.sample_rate, 10)
    //                       : 0
    //               }
    //             : undefined
    //     };
    // }

    extractThumbnail(id: string, outputDir: string, timeInSeconds: number = 2): Promise<string> {
        return new Promise((resolve, reject) => {
            Ffmpeg(this.filePath)
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
