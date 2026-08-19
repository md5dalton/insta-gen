interface MediaConfig {
    MEDIA_ROOT: string
    ASSETS_ROOT: string

    CHUNK_SIZE: number
    DEBOUNCE_MS: number
    BATCH_SIZE: number
    
    VIDEO_EXTENSIONS: string[]
    IMAGE_EXTENSIONS: string[]
    IGNORED_PATTERNS: RegExp[]
}

interface MediaEngineConfig {
    feedWidth: number
    thumbWidth: number
    feedQuality: number
    thumbQuality: number
    segmentDuration: number
    startupDuration: number
    cleanupIntervalMs: number
    ffmpegTimeoutMs: number
    gpuEnabled: boolean
}
    
export const MediaConfig: MediaConfig = {
    MEDIA_ROOT: process.env.MEDIA_ROOT ?? "/media-root/",
    ASSETS_ROOT: process.env.MEDIA_ASSETS_ROOT ?? "/assets-root/",

    CHUNK_SIZE: 10,
    DEBOUNCE_MS: 1000,
    BATCH_SIZE: 50,

    VIDEO_EXTENSIONS: [".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"],
    IMAGE_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp"],
    IGNORED_PATTERNS: [/node_modules/, /\.git/, /Thumbs\.db/, /\.DS_Store/]
}

export const mediaEngineConfig: MediaEngineConfig = {
    feedWidth: 1080,
    thumbWidth: 480,
    feedQuality: 82,
    thumbQuality: 75,
    segmentDuration: 6,
    startupDuration: 10,
    cleanupIntervalMs: 60 * 60 * 1000,
    ffmpegTimeoutMs: 30_000,
    // Enable VA-API hardware acceleration when VAAPI=1 (works for Intel/AMD VA-API drivers)
    gpuEnabled: (process.env.INTEL_GPU === "1") || (process.env.VAAPI === "1"),
}
