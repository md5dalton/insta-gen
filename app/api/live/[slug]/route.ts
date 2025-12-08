import { getMedia } from "@/actions/media"
import { existsSync } from "node:fs"
import ffmpeg from "fluent-ffmpeg"
import { getMediaRoot } from "@/config/media"

export const runtime = "nodejs"

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
            "-b:v 4500k",
            "-f hls",
            "-hls_time 4",
            "-hls_list_size 0",
            "-hls_allow_cache 1",
            "-hls_flags delete_segments",
        ])
        .format("hls")

    // Get a readable stream
    const stream = command.pipe()

    // return Response.json(media)
    // Return the stream to the client
    return new Response(stream, {
        headers: {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Access-Control-Allow-Origin": "*",
            // "Content-Length": media.size

        },
    })
}