import { getPosts } from "@/actions/user"
import { MediaType } from "@/types/type"
import { NextRequest } from "next/server"

export const GET = async (req: NextRequest, { params }) => {

    const { 
        page,
        id
    } = await params

    const searchParams = req.nextUrl.searchParams

    const mediaType = searchParams.get("t")

    if (!mediaType || !["reel", "post"].includes(mediaType)) {
        return new Response("Invalid parameters", { status: 400 })
    }

    const count = 10
    const type = mediaType === "reel" ? MediaType.VIDEO : MediaType.IMAGE
    const skip = page == 0 ? 0 : count * page
    
    const posts = await getPosts(id, type, count, skip)

    return Response.json({
        page,
        hasMore: posts.length < count ? false : true,
        endReached: posts.length < count,
        media: posts.map(({ id }) => ({
            id,
            uid: `${page}:${id}` ,
        }))
    })
}