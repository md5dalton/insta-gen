import { getMedia } from "@/actions/media"
import { getRealpath } from "@/utils/functions"
import { existsSync, statSync, createReadStream } from "node:fs"
import parseRange from "range-parser"

import Ffmpeg from "fluent-ffmpeg"
import ffmpeg from "@ffmpeg-installer/ffmpeg"
import { NextResponse } from "next/server"
import fs from 'node:fs'
import path from "node:path"
// export const runtime = "nodejs"

Ffmpeg.setFfmpegPath(ffmpeg.path)
// console.log(ffmpeg) 
export async function GET({ headers }, { params: { slug } }) {

    const media = await getMedia(slug)
    
    if (!media) return new Response("Media not found", { status: 404 })

    const mediaPath = getRealpath(media.path)

    if (!existsSync(mediaPath)) return new Response("File not found", { status: 404 })

            
    const outputDir = path.join(process.cwd(), 'public', 'hls', slug)
    const masterPath = path.join(outputDir, "master.m3u8")
  
    
    // if already transcoded, just serve cached master playlist
    if (fs.existsSync(masterPath)) {
        const file = fs.createReadStream(masterPath)
        return new Response(file, {
            headers: {
                "Content-Type": "application/vnd.apple.mpegurl",
                "Access-Control-Allow-Origin": "*"
            }
        })
    }

    // otherwise, transcode once and store
    fs.mkdirSync(outputDir, { recursive: true });

    const renditions = [
        { name: "240p", width: 426, height: 240, bitrate: "400k" },
        { name: "480p", width: 854, height: 480, bitrate: "800k" },
        { name: "720p", width: 1280, height: 720, bitrate: "1500k" }
    ]

    console.log("⚙️ Transcoding started…")


    await Promise.all(
        renditions.map(
            (r) =>
                new Promise((resolve, reject) => {
                const outDir = path.join(outputDir, r.name);
                fs.mkdirSync(outDir, { recursive: true });

                Ffmpeg(mediaPath)
                    .videoCodec("libx264")
                    .audioCodec("aac")
                    .size(`${r.width}x${r.height}`)
                    .videoBitrate(r.bitrate)
                    .addOptions([
                        "-preset veryfast",
                        "-g 48",
                        "-sc_threshold 0",
                        "-f hls",
                        "-hls_time 4",
                        "-hls_list_size 0",
                        "-hls_segment_filename",
                        path.join(outDir, "segment_%03d.ts"),
                    ])
                    .output(path.join(outDir, "index.m3u8"))
                    .on("end", resolve)
                    .on("error", (err) => {
                        console.error("FFmpeg error:", err);
                        reject(err);
                    })
                    .run();
                })
        )
    );

    // create master playlist
    const masterPlaylist =
        "#EXTM3U\n" +
        renditions
        .map(
            (r) =>
            `#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(r.bitrate) * 1000},RESOLUTION=${r.width}x${r.height}\n${r.name}/index.m3u8`
        )
        .join("\n");

    fs.writeFileSync(masterPath, masterPlaylist);

    console.log("✅ Transcoding complete — stream cached.");

    const file = fs.createReadStream(masterPath);

    return new Response(file, {
        headers: {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Access-Control-Allow-Origin": "*",
        }
    });
}

// export async function OPTIONS() {
//     return new Response(null, {
//         status: 200,
//         headers: {
//         'Access-Control-Allow-Origin': '*',
//         'Access-Control-Allow-Methods': 'GET, OPTIONS',
//         'Access-Control-Allow-Headers': 'Content-Type, Range',
//         },
//     });
// }