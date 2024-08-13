import { getMedia } from "@/actions/media"
import fs from "fs"

export async function GET(req, { params: { slug } }) {

    const media = await getMedia(slug)

    if (!media) return new Response('Media not found', { status: 404 })
    if (fs.existsSync(media.path)) return new Response('File not found', { status: 404 })
    
    return new Response(fs.readFileSync(media.path), {
        headers: {"Content-Type": "image/jpeg"},
        status: 200
    })

}