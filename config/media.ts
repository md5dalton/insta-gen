import path from "path"

const MEDIA_ASSETS_ROOT =
    process.env.MEDIA_ASSETS_ROOT || path.join(process.env.MEDIA_ROOT || "/media", ".insta-assets")

export const DIR_THUMB = path.join(MEDIA_ASSETS_ROOT, "thumbnails")
export const DIR_FEED_IMAGES = path.join(MEDIA_ASSETS_ROOT, "feed-images")
export const DIR_HLS = path.join(MEDIA_ASSETS_ROOT, "hls")
export const DIR_LOW_QUALITY = path.join(MEDIA_ASSETS_ROOT, "low-quality")
