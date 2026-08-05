export interface MediaEngineConfig {
  feedWidth: number
  thumbWidth: number
  feedQuality: number
  thumbQuality: number
  segmentDuration: number
  startupDuration: number
  cleanupIntervalMs: number
  ffmpegTimeoutMs: number
  gpuEnabled: boolean
  mediaRoot: string
  cacheRoot: string
  imageRoot: string
  videoRoot: string
  hlsRoot: string
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
  gpuEnabled: process.env.INTEL_GPU === "1",
  mediaRoot: process.env.MEDIA_ROOT ?? "/media",
  cacheRoot: process.env.MEDIA_CACHE ?? "/tmp/insta-gen-cache",
  imageRoot: "images",
  videoRoot: "videos",
  hlsRoot: "hls",
}
