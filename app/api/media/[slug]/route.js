import prisma from "@/utils/prisma"
import fs from "fs"

export async function GET(request, { params: { slug } }) {

    const media = await prisma.media.findUnique({
        where: {
            id: slug
        },
        select: {
            path: true
        }
    })

    if (!media) return new Response('Media not found', { status: 404 })
    if (fs.existsSync(media.path)) return new Response('File not found', { status: 404 })
    
    return new Response(fs.readFileSync(media.path), {
        headers: {"Content-Type": "image/jpeg"},
        status: 200
    })

}