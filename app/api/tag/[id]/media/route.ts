import { getMedia, getTagPosts } from "@/actions/tag"
import { ParamsId } from "@/types/type"
import { NextRequest } from "next/server"

export const GET = async (req: NextRequest, { params }: ParamsId) => {

    const { 
        id
    } = await params

    const searchParams = req.nextUrl.searchParams

    const cursor = searchParams.get("cursor")
    
    if (!id || !cursor) return new Response("Invalid parameters", { status: 400 })
        
    const media = await getMedia(cursor)

    if (!media) return new Response("Media is invalid", { status: 400 })

    const posts = await getTagPosts(id, media) || []
    
    return Response.json({
        items: posts.map(({ type, ...rest }) => ({
            ...rest,
            mediaType: type
        })),
        nextCursor:
            posts.length === 10
                ? posts[posts.length - 1].id
                : null,
    })

}