import { getPosts, getTags } from "@/actions/user"
import { Tag } from "@/prisma/generated/client"
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
    
    let items: Media[] | Pick<Tag, "id" | "name">[] = []

    if (!name || !["posts", "reels", "tags"].includes(name)) return new Response("Invalid media type", { status: 400 })

    if (name === "tags") {
        items = await getTags(id, cursor as string)
    } else {
        const mediaType = name === "posts" ? MediaType.IMAGE : MediaType.VIDEO
        const media = await getPosts(id, mediaType, cursor as string)

        items = media.map((i) => ({
            ...i,
            isMedia: true,
            isVideo: mediaType === MediaType.VIDEO
        }))
    }
    
    return Response.json({
        items,
        nextCursor:
            items.length === 10
                ? items[items.length - 1].id
                : null,
    })

}