import { DIR_THUMB, getThumbRoot } from "@/config/media"
import { existsSync, readFileSync } from "fs"
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

    const imagePath = path.join(DIR_THUMB, `${slug}.jpg`)
    
    if (!existsSync(imagePath)) return new Response("Image not found", { status: 404 })
        
    const buffer = readFileSync(imagePath)

    return new Response(new Uint8Array(buffer), {
        headers: { "Content-Type": "image/jpeg" },
    })

}
