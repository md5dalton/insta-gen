import { getMedia, getTag, getTagPosts, TagMedia } from "@/actions/tag"
import { ParamsIdPage } from "@/types/type"
import { NextRequest } from "next/server"

export const GET = async (req: NextRequest, { params }: ParamsIdPage) => {

    const { 
        page: PageString,
        id
    } = await params

    const count = 10
    const page = Number(PageString)
    let posts: TagMedia[] = []
    
    const tag = await getTag(id)

    if (!tag) return new Response("Tag not found", { status: 404 })
    
    const searchParams = req.nextUrl.searchParams

    const mediaId = searchParams.get("media")

    if (mediaId) {

        const media = await getMedia(mediaId)

        if (!media) return new Response("User not found", { status: 404 })

        posts = await getTagPosts(tag.id, count, page == 0 ? 0 : count * page, media) || []

    } else {
        
        posts = await getTagPosts(tag.id, count, page == 0 ? 0 : count * page) || []
        
    }

    const res = posts.map(({ type, tags, ...rest }) => ({
        ...rest,
        uid: `${page}:${rest.id}`,
        tags: tags.map(t => t.tag),
        mediaType: type
    }))
        
    return Response.json({
        page,
        hasMore: posts.length < count ? false : true,
        media: res,
    })

}