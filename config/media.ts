import { mkdirSync } from "fs"
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

export const DIR_MEDIA = process.env.MEDIA_ROOT!
export const DIR_CACHE = process.env.MEDIA_CACHE!

export const DIR_THUMB = path.join(DIR_CACHE, "thumbs")
export const DIR_FEED = path.join(DIR_CACHE, "feed")

export const DIR_FEED_IMAGES = path.join(DIR_FEED, "images")
export const DIR_FEED_VIDEOS = path.join(DIR_FEED, "videos")

mkdirSync(DIR_FEED_IMAGES, { recursive: true })
mkdirSync(DIR_FEED_VIDEOS, { recursive: true })


export const MEDIA_CONFIG: MediaConfig = {
    ROOT_PATH: DIR_MEDIA,
    CHUNK_SIZE: 10,
    DEBOUNCE_MS: 1000,
    BATCH_SIZE: 50,
    VIDEO_EXTENSIONS: [".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"],
    IMAGE_EXTENSIONS: [".jpg", ".jpeg", ".png"],
    IGNORED_PATTERNS: [/node_modules/, /\.git/, /Thumbs\.db/, /\.DS_Store/]
}
