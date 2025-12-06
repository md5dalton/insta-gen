import { homedir } from "os"
import path from "path"

export interface MediaConfig {
    ROOT_PATH: string
    CHUNK_SIZE: number
    DEBOUNCE_MS: number
    BATCH_SIZE: number
    VIDEO_EXTENSIONS: string[]
    IMAGE_EXTENSIONS: string[]
    IGNORED_PATTERNS: RegExp[]
}

export const MEDIA_CONFIG: MediaConfig = {
    ROOT_PATH: process.env.MEDIA_ROOT_PATH || "./media",
    CHUNK_SIZE: 10,
    DEBOUNCE_MS: 1000,
    BATCH_SIZE: 50,
    VIDEO_EXTENSIONS: [".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"],
    IMAGE_EXTENSIONS: [".jpg", ".jpeg", ".png"],
    IGNORED_PATTERNS: [/node_modules/, /\.git/, /Thumbs\.db/, /\.DS_Store/]
}


export const getMediaRoot = (append: string = "") => process.env.MEDIA_ROOT ?
    path.join(homedir(), process.env.MEDIA_ROOT, append) :
    path.join(process.cwd(), "media", append)

export const getThumbRoot = (thumb: string = "") => path.join(process.cwd(), "public", "images", "thumbs", thumb ? `${thumb}.jpg` : "")
    