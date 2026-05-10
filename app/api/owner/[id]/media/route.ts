import { getPosts } from "@/actions/owner"
import { MediaType, ParamsId } from "@/types/type"
import { NextRequest } from "next/server"

interface Media {
    id: string
    ownerId: string
    isMedia: boolean
    isVideo: boolean
}

export const GET = async (req: NextRequest, { params }: ParamsId) => {

    const { 
        id
    } = await params

    const searchParams = req.nextUrl.searchParams

    const cursor = searchParams.get("cursor")
    const name = searchParams.get("name")
    
    let items: Media[] = []

    if (!name || !["posts", "reels"].includes(name)) return new Response("Invalid media type", { status: 400 })

    const mediaType = name === "posts" ? MediaType.IMAGE : MediaType.VIDEO
    const media = await getPosts(id, mediaType, cursor as string)

    items = media.map((i) => ({
        ...i,
        isMedia: true,
        isVideo: mediaType === MediaType.VIDEO
    }))
    
    return Response.json({
        items,
        nextCursor:
            items.length === 10
                ? items[items.length - 1].id
                : null,
    })

}