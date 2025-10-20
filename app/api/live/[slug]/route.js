import { getMedia } from "@/actions/media"
import { getRealpath } from "@/utils/functions"
import { existsSync } from "node:fs"
import ffmpeg from "fluent-ffmpeg"
import ffmpegPath from "@ffmpeg-installer/ffmpeg"

export const runtime = "nodejs"

ffmpeg.setFfmpegPath(ffmpegPath.path)

export async function GET({ headers }, { params }) {
    
    const { slug } = await params

    const media = await getMedia(slug)

    if (!media) return new Response("Media not found", { status: 404 })

    const mediaPath = getRealpath(media.path)

    if (!existsSync(mediaPath)) return new Response("File not found", { status: 404 })

    const command = ffmpeg(mediaPath)
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

    // Return the stream to the client
    return new Response(stream, {
        headers: {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Access-Control-Allow-Origin": "*",
        },
    })
}