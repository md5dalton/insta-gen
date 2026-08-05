import { NextRequest } from "next/server"
import { Storage } from "@/lib/storage"
import { mediaEngineConfig } from "@/lib/config"

const storage = new Storage(mediaEngineConfig.mediaRoot)

export const runtime = "nodejs"

function parseRange(range: string | null, fileSize: number) {
    if (!range) return null

    const match = range.match(/bytes=(\d+)-(\d*)/)
    if (!match) return null

    const start = Number(match[1])
    const end = match[2] ? Number(match[2]) : fileSize - 1
    return { start, end }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const mediaPath = `videos/${slug}/original.mp4`

    if (!(await storage.exists(mediaPath))) return new Response("File not found", { status: 404 })

    const fileSize = (await storage.stat(mediaPath)).size
    const range = req.headers.get("range")

    if (range) {
        const rangeInfo = parseRange(range, fileSize)
        if (!rangeInfo) return new Response("Invalid range header", { status: 416 })
        const stream = await storage.stream(mediaPath)

        return new Response(stream as unknown as ReadableStream, {
            status: 206,
            headers: {
                "Content-Type": "video/mp4",
                "Content-Range": `bytes ${rangeInfo.start}-${rangeInfo.end}/${fileSize}`,
                "Content-Length": (rangeInfo.end - rangeInfo.start + 1).toString(),
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=31536000",
            },
        })
    }

    const stream = await storage.stream(mediaPath)
    return new Response(stream as unknown as ReadableStream, {
        headers: {
            "Content-Type": "video/mp4",
            "Content-Length": fileSize.toString(),
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=31536000",
        }
    })
}