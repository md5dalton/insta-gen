import { getMedia } from "@/actions/media"
import { getRealpath } from "@/utils/functions"
import { existsSync, statSync, createReadStream } from "node:fs"
import parseRange from "range-parser"

import Ffmpeg from "fluent-ffmpeg"
import ffmpeg from "@ffmpeg-installer/ffmpeg"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

Ffmpeg.setFfmpegPath(ffmpeg.path)
// console.log(ffmpeg) 
export async function GET({ headers }, { params: { slug } }) {

    const media = await getMedia(slug)
    
    if (!media) return new Response("Media not found", { status: 404 })

    const mediaPath = getRealpath(media.path)

    if (!existsSync(mediaPath)) return new Response("File not found", { status: 404 })

    const command = Ffmpeg(mediaPath)
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
    const stream = command.pipe();

    // Return the stream to the client
    return new Response(stream, {
        headers: {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Access-Control-Allow-Origin": "*",
        },
    })
        
}