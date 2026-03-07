import { getMedia } from "@/actions/media"
import { DIR_MEDIA, DIR_THUMB, getMediaRoot } from "@/config/media"
import fs from "fs"
import { NextRequest } from "next/server"
import path from "path"


interface Params {
    slug: string
}
export async function GET(
    req: NextRequest,
    props: { params: Promise<Params> }
): Promise<Response> {
    const { slug } = await props.params

    const media = await getMedia(slug)

    if (!media) return new Response('Media not found', { status: 404 })

    const mediaPath = path.join(DIR_MEDIA, media.path)

    if (!fs.existsSync(mediaPath)) return new Response('File not found', { status: 404 })

    const buffer = fs.readFileSync(mediaPath)
        
    return new Response(new Uint8Array(buffer), {
        headers: { "Content-Type": "image/jpeg" },
    })
}