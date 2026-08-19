import { NextRequest } from "next/server"
import { Storage } from "@/lib/storage"
import { getMedia } from "@/actions/media"
import { MediaConfig } from "@/lib/config"

const storage = new Storage(MediaConfig.MEDIA_ROOT)

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    const media = await getMedia(slug)

    if (!media) return new Response("Media not found", { status: 404 })

    if (!(await storage.exists(media.path))) return new Response("Image not found", { status: 404 })

    const stream = await storage.stream(media.path)

    return new Response(stream as unknown as ReadableStream, {
        headers: {
            "Content-Type": "video/mp4",
            "Cache-Control": "public, max-age=31536000, immutable",
            ETag: slug,
        },
    })
}
