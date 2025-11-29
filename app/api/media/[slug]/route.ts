import { getMedia } from "@/actions/media"
import { getRealpath } from "@/utils/functions"
import fs from "fs"
import { NextRequest } from "next/server"


interface Params {
    slug: string
}
export async function GET(
    req: NextRequest,
    props: { params: Promise<Params> }
): Promise<Response> {
    const { slug } = await props.params

    const media = await getMedia(slug)

    const path = getRealpath(media.path)

    if (!media) return new Response('Media not found', { status: 404 })
    if (!fs.existsSync(path)) return new Response('File not found', { status: 404 })

    const buffer = fs.readFileSync(path)
        
    return new Response(new Uint8Array(buffer), {
        headers: { "Content-Type": "image/jpeg" },
    })
    
    // return new Response(fs.readFileSync(path), {
    //     headers: {"Content-Type": "image/jpeg"},
    //     status: 200
    // })
}