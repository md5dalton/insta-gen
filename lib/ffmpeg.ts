import { spawn } from "node:child_process"
import { EventEmitter } from "node:events"
import { TranscodeError, TimeoutError } from "./errors"

export interface FFmpegProgress {
    frame?: number
    fps?: number
    size?: string
    time?: string
    bitrate?: string
    speed?: string
}

export class FFmpegProcess extends EventEmitter {
    private child: ReturnType<typeof spawn> | null = null
    private stderrBuffer = ""
    private timer: NodeJS.Timeout | null = null

    constructor(
        private readonly command: string[],
        private readonly timeoutMs: number
    ) {
        super()
    }

    start(): void {
        this.child = spawn(this.command[0], this.command.slice(1), {
            stdio: ["ignore", "pipe", "pipe"],
        })

        this.child.stdout?.on("data", () => undefined)
        this.child.stderr?.on("data", (chunk) => {
            const text = chunk.toString()
            this.stderrBuffer += text
            this.parseProgress(text)
        })

        this.child.on("error", (error) => {
            this.cleanup()
            this.emit("error", new TranscodeError("ffmpeg failed", error))
        })

        this.child.on("close", (code) => {
            this.cleanup()
            if (code !== 0) {
                // Remove ffmpeg progress-like lines to avoid noisy garbage in the error message
                const lines = this.stderrBuffer.split(/\r?\n/)
                const filtered = lines
                    .filter((line) => !/(frame=|fps=|size=|time=|bitrate=|speed=)/.test(line))
                    .map((l) => l.trim())
                    .filter(Boolean)
                const cleaned = filtered.slice(-10).join("\n")
                const message = cleaned || this.stderrBuffer || "ffmpeg exited unexpectedly"
                this.emit("error", new TranscodeError(message))
                return
            }
            this.emit("end")
        })

        this.timer = setTimeout(() => {
            this.kill()
            this.emit("error", new TimeoutError("ffmpeg timed out"))
        }, this.timeoutMs)
    }

    kill(): void {
        this.child?.kill("SIGTERM")
    }

    private cleanup(): void {
        if (this.timer) {
            clearTimeout(this.timer)
            this.timer = null
        }
    }

    private parseProgress(text: string): void {
        const match = text.match(/time=([0-9:.]+)/)
        if (!match) {
            return
        }
        const progress: FFmpegProgress = { time: match[1] }
        this.emit("progress", progress)
    }
}

export class FFmpeg {
    constructor(private readonly timeoutMs: number) {}

    run(args: string[]): FFmpegProcess {
        const process = new FFmpegProcess(args, this.timeoutMs)
        process.start()
        return process
    }
}
