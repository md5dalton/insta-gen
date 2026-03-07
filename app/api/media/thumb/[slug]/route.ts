import { DIR_THUMB } from "@/config/media"
import { ParamsSlug } from "@/types/type"
import { existsSync, readFileSync } from "fs"
import { NextRequest } from "next/server"
import path from "path"

export async function GET(
    req: NextRequest,
    { params }: ParamsSlug
): Promise<Response> {

    const { slug } = await params

    const imagePath = path.join(DIR_THUMB, `${slug}.jpg`)
    
    if (!existsSync(imagePath)) return new Response("Image not found", { status: 404 })
        
    const buffer = readFileSync(imagePath)

    return new Response(new Uint8Array(buffer), {
        headers: { "Content-Type": "image/jpeg" },
    })

}
