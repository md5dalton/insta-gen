import { getMedia } from "@/actions/media"
import { getMediaDir, getRealpath } from "@/utils/functions"
import fs from "fs"

export async function GET(req, { params: { slug } }) {

    
    const media = await getMedia(slug)
    
    const path = getRealpath(media.path)

    if (!media) return new Response('Media not found', { status: 404 })
    if (fs.existsSync(path)) return new Response('File not found', { status: 404 })
    
    return new Response(fs.readFileSync(path), {
        headers: {"Content-Type": "image/jpeg"},
        status: 200
    })

}