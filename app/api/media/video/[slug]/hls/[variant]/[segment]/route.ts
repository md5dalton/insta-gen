import { NextRequest } from "next/server"

import { Storage } from "@/lib/storage"
import { MediaConfig } from "@/lib/config"

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
            segment: string
        }>
    }
) {
    const { slug, variant, segment } = await params

    if (variant !== "1080") {
        return new Response("Unsupported variant", { status: 404 })
    }

    if (!/^segment\d{3}\.ts$/.test(segment)) {
        return new Response("Invalid segment", { status: 400 })
    }

    const segmentPath = `videos/${slug}/hls/${variant}/${segment}`

    if (!(await storage.exists(segmentPath))) {
        return new Response("Segment not found", { status: 404 })
    }

    const content = await storage.readBuffer(segmentPath)

    return new Response(new Uint8Array(content), {
        headers: {
            "Content-Type": "video/mp2t",

            "Content-Length": String(content.length),

            "Cache-Control": "public, max-age=31536000, immutable",
        },
    })
}
