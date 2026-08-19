import { spawn } from "node:child_process"
import { TranscodeError } from "./errors"

export interface ProbeSideData {
  side_data_type?: string
  rotation?: string
  displaymatrix?: string
}

export interface ProbeStream {
  codec_type?: string
  codec_name?: string
  width?: number
  height?: number
  duration?: string
  bit_rate?: string
  avg_frame_rate?: string
  channels?: number
  sample_rate?: number
  tags?: Record<string, string>
  side_data_list?: ProbeSideData[]
}

export interface ProbeFormat {
  duration?: string
  bit_rate?: string
}

export interface ProbeResult {
  streams: ProbeStream[]
  format: ProbeFormat
}

export class FFprobe {
  async probe(inputPath: string): Promise<ProbeResult> {
    const output = await this.run(["-v", "error", "-print_format", "json", "-show_streams", "-show_format", inputPath])
    return JSON.parse(output) as ProbeResult
  }

  async resolution(inputPath: string): Promise<{ width: number; height: number }> {
    const probe = await this.probe(inputPath)
    const stream = probe.streams.find((item) => item.codec_type === "video")
    if (!stream?.width || !stream?.height) {
      throw new TranscodeError("Unable to determine video resolution")
    }
    return { width: stream.width, height: stream.height }
  }

  async duration(inputPath: string): Promise<number> {
    const probe = await this.probe(inputPath)
    const raw = probe.format.duration ?? probe.streams.find((item) => item.codec_type === "video")?.duration
    if (!raw) {
      throw new TranscodeError("Unable to determine video duration")
    }
    return Number(raw)
  }

  async bitrate(inputPath: string): Promise<string | undefined> {
    const probe = await this.probe(inputPath)
    return probe.format.bit_rate ?? probe.streams.find((item) => item.codec_type === "video")?.bit_rate
  }

  async codec(inputPath: string): Promise<string | undefined> {
    const probe = await this.probe(inputPath)
    return probe.streams.find((item) => item.codec_type === "video")?.codec_name
  }

  async fps(inputPath: string): Promise<number | undefined> {
    const probe = await this.probe(inputPath)
    const stream = probe.streams.find((item) => item.codec_type === "video")
    const avgFrameRate = stream?.avg_frame_rate
    if (!avgFrameRate) {
      return undefined
    }
    const [numerator, denominator] = avgFrameRate.split("/").map(Number)
    if (!denominator || !numerator) {
      return undefined
    }
    return numerator / denominator
  }

  async audio(inputPath: string): Promise<{ codec?: string; channels?: number; sampleRate?: number } | undefined> {
    const probe = await this.probe(inputPath)
    const stream = probe.streams.find((item) => item.codec_type === "audio")
    if (!stream) {
      return undefined
    }
    return {
      codec: stream.codec_name,
      channels: stream.channels,
      sampleRate: stream.sample_rate,
    }
  }

  private run(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn("ffprobe", args, { stdio: ["ignore", "pipe", "pipe"] })
      let stdout = ""
      let stderr = ""

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString()
      })

      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString()
      })

      child.on("error", (error) => reject(new TranscodeError("ffprobe failed", error)))
      child.on("close", (code) => {
        if (code !== 0) {
          reject(new TranscodeError(stderr || "ffprobe exited unexpectedly"))
          return
        }
        resolve(stdout)
      })
    })
  }
}
