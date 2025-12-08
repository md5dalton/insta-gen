import { getMedia } from "@/actions/media"
import { existsSync } from "node:fs"
import ffmpeg from "fluent-ffmpeg"
import { getMediaRoot } from "@/config/media"
import { Readable } from "stream"

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
export async function GET({ headers }, { params }) {
    
    const { slug } = await params

    const media = await getMedia(slug)

    if (!media) return new Response("Media not found", { status: 404 })
    
    const path =  getMediaRoot(media.path)

    // const mediaPath = getRealpath(media.path)

    if (!existsSync(path)) return new Response("File not found", { status: 404 })

    const command = ffmpeg(path)
        .videoCodec("libx264")
        .audioCodec("aac")
        .addOptions([
            "-preset fast",
            "-movflags frag_keyframe+empty_moov", // required to stream MP4
            "-frag_duration 2000000", // ~2s fragments (recommended)
            "-b:v 4500k",
        ])
        .format("mp4")

    // Get a readable stream
    // const stream = command.pipe()

    const nodeStream = command.pipe()
    const webStream = nodeStreamToWeb(nodeStream)
    // return Response.json(media)
    // Return the stream to the client
    return new Response(webStream, {
        headers: {
            "Content-Type": "video/mp4",
            "Access-Control-Allow-Origin": "*",
            // "Content-Length": media.size.toString()

        },
    })
}