import { getMedia } from "@/actions/media"
import { createReadStream, existsSync } from "node:fs"
import { DIR_MEDIA, getMediaRoot } from "@/config/media"
import { Readable } from "stream"
import path from "path"

export const runtime = "nodejs"

function nodeStreamToWeb(stream: Readable): ReadableStream {
    return new ReadableStream({
        start(controller) {
            stream.on("data", chunk => controller.enqueue(chunk))
            stream.on("end", () => controller.close())
            stream.on("error", err => controller.error(err))
        },
        cancel() {
            stream.destroy()
        }
    })
}

function parseRange(range: string | null, fileSize: number) {
    if (!range) return null
    
    const match = range.match(/bytes=(\d+)-(\d*)/)
    if (!match) return null
    
    const start = parseInt(match[1], 10)
    const end = match[2] ? parseInt(match[2], 10) : fileSize - 1
    
    return { start, end }
}

export async function GET({ headers }, { params }) {
    
    const { slug } = await params

    const media = await getMedia(slug)

    if (!media) return new Response("Media not found", { status: 404 })
    
    const mediaPath = path.join(DIR_MEDIA, media.path)
        
    if (!existsSync(mediaPath)) return new Response("File not found", { status: 404 })

    const range = headers.get('range')
    const fileSize = media.size
    if (range) {
        const rangeInfo = parseRange(range, fileSize)
        if (!rangeInfo) return new Response("Invalid range header", { status: 416 })
        
        // For direct file serving with range support
        const stream = createReadStream(mediaPath, {
            start: rangeInfo.start,
            end: rangeInfo.end
        })
        
        const webStream = nodeStreamToWeb(stream)
        
        return new Response(webStream, {
            status: 206,
            headers: {
                "Content-Type": "video/mp4",
                "Content-Range": `bytes ${rangeInfo.start}-${rangeInfo.end}/${fileSize}`,
                "Content-Length": (rangeInfo.end - rangeInfo.start + 1).toString(),
                "Accept-Ranges": "bytes",
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=31536000"
            },
        })
    }
    
    // Full file response
    const stream = createReadStream(mediaPath)
    
    return new Response(nodeStreamToWeb(stream), {
        headers: {
            "Content-Type": "video/mp4",
            "Content-Length": fileSize.toString(),
            "Accept-Ranges": "bytes",
            "Access-Control-Allow-Origin": "*"
        }
    })
}