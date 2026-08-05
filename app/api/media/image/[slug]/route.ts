import { NextRequest } from "next/server"
import { Storage } from "@/lib/storage"
import { mediaEngineConfig } from "@/lib/config"

const storage = new Storage(mediaEngineConfig.mediaRoot)

export const runtime = "nodejs"

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const preferredPath = (await storage.exists(`images/${slug}/feed.webp`))
        ? `images/${slug}/feed.webp`
        : `images/${slug}/original`

    if (!(await storage.exists(preferredPath))) {
        return new Response("Media not found", { status: 404 })
    }

    const stream = await storage.stream(preferredPath)

    return new Response(stream as unknown as ReadableStream, {
        headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "public, max-age=31536000, immutable",
            ETag: slug,
        },
    })
}