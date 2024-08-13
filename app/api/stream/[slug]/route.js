import { getMedia } from "@/actions/media"
import { existsSync, statSync, createReadStream } from "node:fs"
import parseRange from "range-parser"

export async function GET({ headers }, { params: { slug } }) {

    const media = await getMedia(slug)
    
    if (!media) return new Response("Media not found", { status: 404 })

    const mediaPath = media.path

    if (!existsSync(mediaPath)) return new Response("File not found", { status: 404 })
        
    const { size } = statSync(mediaPath)
    const range = headers.range ||"bytes=0"
    
    const parsedRange = parseRange(size, range, { combine: true })
    
    if (!parsedRange || parsedRange === -1 || parsedRange.type !== "bytes") return new Response("Invalid range", { status: 400 })

    const { start, end } = parsedRange.shift()
    const chunkSize = end - start + 1

    const head = {
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Content-Length": chunkSize,
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
    }

    return new Response(createReadStream(mediaPath, { start, end }), {
        headers: head,
        status: 206
    })
    
}