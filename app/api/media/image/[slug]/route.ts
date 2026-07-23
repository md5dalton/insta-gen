import { getMedia } from "@/actions/media"
import { DIR_FEED_IMAGES, DIR_MEDIA } from "@/config/media"
import fs from "fs"
import { NextRequest } from "next/server"
import path from "path"
import { createReadStream, existsSync } from "fs"
import { Readable } from "stream"

interface Params {
    slug: string
}

export async function GET(
    req: NextRequest,
    props: { params: Promise<Params> }
): Promise<Response> {
    const { slug } = await props.params

    const searchParams = req.nextUrl.searchParams

    const download = searchParams.get("download")

    const media = await getMedia(slug)

    if (!media) return new Response("Media not found", { status: 404 })

    const feed = path.join(DIR_FEED_IMAGES, `${slug}.webp`)
    const original =  path.join(DIR_MEDIA, media.path)

    let mediaPath
    
    if (download) {
        mediaPath = original
    } else {
        mediaPath = !existsSync(feed) ? original : feed
    }
    
    if (!existsSync(mediaPath)) return new Response("File not found", { status: 404 })

    const stream = Readable.toWeb(
        createReadStream(mediaPath)
    )

    return new Response(stream as ReadableStream, {
        headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "public, max-age=31536000, immutable",
        },
    })
}