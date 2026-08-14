import { NextRequest } from "next/server"
import { Storage } from "@/lib/storage"
import { MediaConfig } from "@/lib/config"

const storage = new Storage(MediaConfig.ASSETS_ROOT)

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    
    const imagePath = `feed/${slug}.webp`

    if (!(await storage.exists(imagePath))) return new Response("Image not found", { status: 404 })

    const stream = await storage.stream(imagePath)

    return new Response(stream as unknown as ReadableStream, {
        headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "public, max-age=31536000, immutable",
            ETag: slug,
        },
    })

}