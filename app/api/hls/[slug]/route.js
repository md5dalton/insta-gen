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

            
    const outputDir = path.join(process.cwd(), 'public', 'hls', slug);
    const masterPlaylist = path.join(outputDir, 'master.m3u8');
  
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    // Check if HLS files already exist
    if (fs.existsSync(masterPlaylist)) {
        const manifest = fs.readFileSync(masterPlaylist, 'utf8');
        return new Response(manifest, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.apple.mpegurl',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=3600',
            },
        });
    }

    return new Promise((resolve, reject) => {
        Ffmpeg(mediaPath)
            .videoCodec("libx264")
            .audioCodec("aac")
            .addOptions([
                '-preset fast',
                '-g 48',
                '-sc_threshold 0',
                '-map 0:v:0',
                '-map 0:a:0',
            ])
            // .complexFilter([
            //     // Split the video stream into three quality streams
            //     {
            //         filter: 'split',
            //         options: '3',
            //         inputs: '0:v',
            //         outputs: ['720p', '480p', '360p']
            //     }
            // ])
            // .outputOptions([
            //     '-map', '[720p]',
            //     '-c:v:0', 'libx264',
            //     '-b:v:0', '2000k',
            //     '-maxrate:v:0', '2200k', 
            //     '-bufsize:v:0', '4000k',
            //     '-crf', '20',
            //     '-r', '30',
            //     '-g', '60',
            //     '-keyint_min', '60',
            //     '-sc_threshold', '0',
            //     '-profile:v:0', 'high',
            //     '-level', '4.0',
            //     '-pix_fmt', 'yuv420p',
            //     '-s', '1280x720'
            // ])
            // // 480p stream
            // .outputOptions([
            //     '-map', '[480p]',
            //     '-c:v:1', 'libx264',
            //     '-b:v:1', '1000k',
            //     '-maxrate:v:1', '1100k',
            //     '-bufsize:v:1', '2000k',
            //     '-crf', '22',
            //     '-r', '30',
            //     '-g', '60',
            //     '-keyint_min', '60',
            //     '-sc_threshold', '0',
            //     '-profile:v:1', 'main',
            //     '-level', '3.1',
            //     '-pix_fmt', 'yuv420p',
            //     '-s', '854x480'
            // ])
            // // 360p stream
            // .outputOptions([
            //     '-map', '[360p]',
            //     '-c:v:2', 'libx264',
            //     '-b:v:2', '500k',
            //     '-maxrate:v:2', '550k',
            //     '-bufsize:v:2', '1000k',
            //     '-crf', '24',
            //     '-r', '30',
            //     '-g', '60',
            //     '-keyint_min', '60',
            //     '-sc_threshold', '0',
            //     '-profile:v:2', 'baseline',
            //     '-level', '3.0',
            //     '-pix_fmt', 'yuv420p',
            //     '-s', '640x360'
            // ])
            
            // Audio settings
            .outputOptions([
                '-map', '0:a',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-ac', '2'
            ])
            // HLS settings
            .outputOptions([
                '-f', 'hls',
                '-hls_time', '4',
                '-hls_list_size', '0',
                '-hls_segment_filename', `${outputDir}/segment_%v_%03d.ts`,
                '-master_pl_name', 'master.m3u8',
                '-var_stream_map', 'v:0,a:0 v:1,a:0 v:2,a:0',
                '-hls_base_url', `/hls/${slug}/`
            ])
            // .outputOptions([
            //     // 720p stream
            //     '-filter_complex [0:v]split=3[720p][480p][360p]',
            //     '-map [720p] -c:v:0 libx264 -b:v:0 2000k -maxrate:v:0 2200k -bufsize:v:0 4000k -crf 20 -r 30 -g 60 -keyint_min 60 -sc_threshold 0 -profile:v:0 high -level 4.0 -x264opts:0 no-scenecut -pix_fmt yuv420p -s 1280x720',
            //     '-map [480p] -c:v:1 libx264 -b:v:1 1000k -maxrate:v:1 1100k -bufsize:v:1 2000k -crf 22 -r 30 -g 60 -keyint_min 60 -sc_threshold 0 -profile:v:1 main -level 3.1 -x264opts:1 no-scenecut -pix_fmt yuv420p -s 854x480',
            //     '-map [360p] -c:v:2 libx264 -b:v:2 500k -maxrate:v:2 550k -bufsize:v:2 1000k -crf 24 -r 30 -g 60 -keyint_min 60 -sc_threshold 0 -profile:v:2 baseline -level 3.0 -x264opts:2 no-scenecut -pix_fmt yuv420p -s 640x360',
            //     '-map 0:a -c:a aac -b:a 128k -ac 2',
            //     '-f hls',
            //     '-hls_time 4',
            //     '-hls_list_size 0',
            //     '-hls_segment_filename', `${outputDir}/segment_%v_%03d.ts`,
            //     '-master_pl_name master.m3u8',
            //     '-var_stream_map', 'v:0,a:0 v:1,a:0 v:2,a:0',
            //     '-hls_base_url', `/hls/${slug}/`
            // ])
            .output(`${outputDir}/playlist_%v.m3u8`)
            .on('start', (commandLine) => {
                console.log('HLS generation started:', commandLine);
            })
            .on('progress', (progress) => {
                console.log('Processing: ' + progress.percent + '% done');
            })
            .on('end', () => {
                console.log('HLS generation finished');
                const manifest = fs.readFileSync(masterPlaylist, 'utf8');
                const response = new Response(manifest, {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/vnd.apple.mpegurl',
                        'Access-Control-Allow-Origin': '*',
                        'Cache-Control': 'public, max-age=3600',
                    },
                });
                resolve(response);
            })
            .on('error', (err) => {
                console.error('HLS generation error:', err);
                reject(NextResponse.json({ error: 'HLS generation failed' }, { status: 500 }));
            })
            .run();
    });
}

export async function OPTIONS() {
    return new Response(null, {
        status: 200,
        headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
        },
    });
}