import { getPosts } from "@/actions/user"
import { MediaType, ParamsId } from "@/types/type"
import { NextRequest } from "next/server"

export const GET = async (req: NextRequest, { params }: ParamsId) => {

    const { 
        id
    } = await params

    const searchParams = req.nextUrl.searchParams

    const cursor = searchParams.get("cursor")
    const mediaType = searchParams.get("type")
    
    if (!mediaType || ![MediaType.IMAGE, MediaType.VIDEO].includes(mediaType as MediaType)) {
        return new Response("Invalid media type", { status: 400 })
    }

    const posts = await getPosts(id, mediaType as MediaType, cursor as string)
    
    return Response.json({
        items: posts,
        nextCursor:
            posts.length === 10
                ? posts[posts.length - 1].id
                : null,
    })

}