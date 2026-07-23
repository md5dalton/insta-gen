import { DIR_THUMB } from "@/config/media"
import { ParamsSlug } from "@/types/type"
import { existsSync } from "fs"
import { NextRequest } from "next/server"
import path from "path"
import { createReadStream } from "fs"
import { Readable } from "stream"

export async function GET(
    req: NextRequest,
    { params }: ParamsSlug
): Promise<Response> {

    const { slug } = await params

    const imagePath = path.join(DIR_THUMB, `${slug}.jpg`)
    
    if (!existsSync(imagePath)) return new Response("Image not found", { status: 404 })
        
    const stream = Readable.toWeb(
        createReadStream(imagePath)
    )

    return new Response(stream as ReadableStream, {
        headers: {
            "Content-Type": "image/jpg",
            "Cache-Control": "public, max-age=31536000, immutable",
        },
    })

}
