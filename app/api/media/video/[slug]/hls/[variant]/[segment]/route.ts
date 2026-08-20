import { NextRequest } from "next/server"

import { Storage } from "@/lib/storage"
import { MediaConfig } from "@/lib/config"
import { getMedia } from "@/actions/media"
import {
    SegmentNotFoundError,
    VideoProcessor,
} from "@/lib/videoProcessor"

import path from "path"

const storage =
    new Storage(MediaConfig.ASSETS_ROOT)

export const runtime = "nodejs"

export async function GET(
    req: NextRequest,
    {
        params,
    }: {
        params: Promise<{
            slug: string
            variant: string
            segment: string
        }>
    }
) {
    const {
        slug,
        variant,
        segment,
    } = await params

    /*
     * Only support the currently available
     * HLS variant.
     */
    if (variant !== "1080") {
        return new Response(
            "Unsupported variant",
            {
                status: 404,
            }
        )
    }

    /*
     * Only accept:
     *
     * segment000.ts
     * segment001.ts
     * segment002.ts
     * etc.
     */
    const match =
        /^segment(\d{3})\.ts$/.exec(segment)

    if (!match) {
        return new Response(
            "Invalid segment",
            {
                status: 400,
            }
        )
    }

    const segmentNumber =
        Number(match[1])

    const segmentPath =
        `videos/${slug}/hls/${variant}/${segment}`

    /*
     * Fast path:
     *
     * Previously generated segments are
     * permanently stored.
     */
    if (
        await storage.exists(
            segmentPath
        )
    ) {
        return serveSegment(segmentPath)
    }

    /*
     * Resolve the original source.
     */
    const video =
        await getMedia(slug)

    if (!video) {
        return new Response(
            "Video source not found",
            {
                status: 404,
            }
        )
    }

    const processor =
        new VideoProcessor(
            storage,
            path.join(
                MediaConfig.MEDIA_ROOT,
                video.path
            ),
            slug
        )

    try {
        /*
         * generateSegment() has its own
         * per-segment lock, so concurrent
         * requests for the same segment
         * won't run FFmpeg twice.
         */
        await processor.generateSegment(
            segmentNumber
        )
    } catch (error) {
        if (
            error instanceof
            SegmentNotFoundError
        ) {
            return new Response(
                "Segment not found",
                {
                    status: 404,
                }
            )
        }

        console.error(
            `[HLS] Failed to generate ${segmentPath}`,
            error
        )

        return new Response(
            "Failed to generate segment",
            {
                status: 500,
            }
        )
    }

    /*
     * FFmpeg must have successfully created
     * the segment before we attempt to serve it.
     */
    if (
        !(await storage.exists(
            segmentPath
        ))
    ) {
        console.error(
            `[HLS] Segment generation completed but file is missing: ${segmentPath}`
        )

        return new Response(
            "Segment not found",
            {
                status: 404,
            }
        )
    }

    return serveSegment(segmentPath)
}

async function serveSegment(
    segmentPath: string
): Promise<Response> {
    const content =
        await storage.readBuffer(
            segmentPath
        )

    return new Response(
        new Uint8Array(content),
        {
            status: 200,
            headers: {
                "Content-Type":
                    "video/mp2t",

                "Content-Length":
                    String(content.length),

                /*
                 * Segments are immutable once
                 * generated, so aggressive caching
                 * is appropriate.
                 */
                "Cache-Control":
                    "public, max-age=31536000, immutable",
            },
        }
    )
}