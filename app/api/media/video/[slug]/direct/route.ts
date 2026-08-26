import { NextRequest } from "next/server"
import { Storage } from "@/lib/storage"
import { MediaConfig } from "@/lib/config"
import { getMedia } from "@/actions/media"

export const runtime = "nodejs"

function parseRange(range: string | null, fileSize: number) {
    if (!range) return null

    const match = range.match(/^bytes=(\d*)-(\d*)$/)

    if (!match) return null

    let start: number
    let end: number

    if (match[1] === "") {
        // bytes=-500
        const length = Number(match[2])

        if (!Number.isSafeInteger(length) || length <= 0) {
            return null
        }

        start = Math.max(fileSize - length, 0)
        end = fileSize - 1
    } else {
        start = Number(match[1])

        end = match[2] ? Number(match[2]) : fileSize - 1
    }

    if (
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(end) ||
        start < 0 ||
        start >= fileSize ||
        start > end
    ) {
        return null
    }

    end = Math.min(end, fileSize - 1)

    return { start, end }
}

const storage = new Storage(MediaConfig.MEDIA_ROOT)

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    const media = await getMedia(slug)

    if (!media) {
        return new Response("DB Media not found", { status: 404 })
    }

    const mediaPath = media.path

    if (!(await storage.exists(mediaPath))) {
        return new Response("File not found", { status: 404 })
    }

    const fileSize = Number((await storage.stat(mediaPath)).size)
    const range = req.headers.get("range")

    if (range) {
        const rangeInfo = parseRange(range, fileSize)

        if (!rangeInfo) {
            return new Response("Invalid range header", {
                status: 416,
                headers: {
                    "Content-Range": `bytes */${fileSize}`,
                },
            })
        }

        const { start, end } = rangeInfo
        const contentLength = end - start + 1

        const stream = await storage.stream(mediaPath, {
            start,
            end,
        })

        return new Response(stream as unknown as ReadableStream, {
            status: 206,
            headers: {
                "Content-Type": "video/mp4",
                "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                "Content-Length": contentLength.toString(),
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=31536000",
                "Access-Control-Allow-Origin": "*",
            },
        })
    }

    const stream = await storage.stream(mediaPath)

    return new Response(stream as unknown as ReadableStream, {
        status: 200,
        headers: {
            "Content-Type": "video/mp4",
            "Content-Length": fileSize.toString(),
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=31536000",
            "Access-Control-Allow-Origin": "*",
        },
    })
}
