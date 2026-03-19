import { getPost, getUserPosts, Post } from "@/actions/post"
import { ParamsIdPage } from "@/types/type"
import { NextRequest } from "next/server"

export const GET = async (req: NextRequest, { params }: ParamsIdPage) => {

    const { 
        page: PageString,
        id
    } = await params

    const page = Number(PageString)

    const count = 10
    
    const post = await getPost(id)

    if (!post) return new Response("Post not found", { status: 404 })
    
    const posts = await getUserPosts(post.owner.id, id, count, page == 0 ? 0 : count * page)

    const res = posts.map(({ type, ...rest }: Post) => ({
        ...rest,
        uid: `${page}:${rest.id}`,
        mediaType: type
    }))
        
    return Response.json({
        page,
        hasMore: posts.length < count ? false : true,
        media: res,
    })

}