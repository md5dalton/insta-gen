import { getPosts } from "@/actions/user"
import { MediaType } from "@/types/type"
import { NextRequest } from "next/server"

type Params = {
    params: Promise<{ id: string, page: number }>
}

export const GET = async (req: NextRequest, { params }: Params) => {

    const { 
        page,
        id
    } = await params

    const searchParams = req.nextUrl.searchParams

    const mediaType = searchParams.get("t")

    if (!mediaType || ![MediaType.IMAGE, MediaType.VIDEO].includes(mediaType as MediaType)) {
        return new Response("Invalid parameters", { status: 400 })
    }

    const count = 10
    const skip = page == 0 ? 0 : count * page
    
    const posts = await getPosts(id, mediaType as MediaType, count, skip)

    return Response.json({
        page,
        hasMore: posts.length < count ? false : true,
        media: posts.map(({ id }) => ({
            id,
            uid: `${page}:${id}` ,
        }))
    })
}