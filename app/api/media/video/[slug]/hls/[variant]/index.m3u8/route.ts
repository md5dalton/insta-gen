import { NextRequest } from "next/server"

import { Storage } from "@/lib/storage"
import { MediaConfig } from "@/lib/config"

const storage =
    new Storage(MediaConfig.ASSETS_ROOT)

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
    const {
        slug,
        variant,
    } = await params

    if (variant !== "1080") {
        return new Response(
            "Unsupported variant",
            { status: 404 }
        )
    }

    const playlistPath =
        `videos/${slug}/hls/${variant}/index.m3u8`

    if (
        !(await storage.exists(
            playlistPath
        ))
    ) {
        return new Response(
            "Playlist not found",
            { status: 404 }
        )
    }

    const content =
        await storage.readFile(
            playlistPath
        )

    return new Response(
        content,
        {
            headers: {
                "Content-Type":
                    "application/vnd.apple.mpegurl",

                "Cache-Control":
                    "public, max-age=31536000, immutable",
            },
        }
    )
}