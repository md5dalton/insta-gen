import { NextRequest } from "next/server"
import { Storage } from "@/lib/storage"
import { MediaConfig } from "@/lib/config"
import { getMedia } from "@/actions/media"
import { VideoProcessor } from "@/lib/videoProcessor"
import path from "path"

const storage = new Storage(MediaConfig.ASSETS_ROOT)

export const runtime = "nodejs"

export async function GET(
    req: NextRequest,
    {
        params,
    }: {
        params: Promise<{
            slug: string
            variant: string
        }>
    }
) {
    const { slug, variant } = await params

    if (variant !== "1080") {
        return new Response("Unsupported variant", {
            status: 404,
        })
    }

    const video = await getMedia(slug)

    if (!video) {
        return new Response("Video not found", {
            status: 404,
        })
    }

    const metadataPath =
        `videos/${slug}/metadata.json`

    if (!(await storage.exists(metadataPath))) {
        return new Response("Video metadata not found", {
            status: 404,
        })
    }

    const processor = new VideoProcessor(
        storage,
        path.join(MediaConfig.MEDIA_ROOT, video.path),
        slug
    )

    try {
        const playlist =
            await processor.renderAvailablePlaylist()

        return new Response(playlist, {
            status: 200,
            headers: {
                "Content-Type":
                    "application/vnd.apple.mpegurl",

                // HLS clients must re-fetch the playlist.
                "Cache-Control":
                    "no-store, no-cache, must-revalidate, proxy-revalidate",

                "Pragma": "no-cache",
                "Expires": "0",
            },
        })
    } catch (error) {
        console.error(
            `[HLS] Failed to generate playlist for ${slug}/${variant}`,
            error
        )

        return new Response(
            "Failed to generate playlist",
            {
                status: 500,
            }
        )
    }
}