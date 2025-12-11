import { getPost, getUserPosts, Post } from "@/actions/post"
import { MediaType } from "@/types/type"

export const GET = async (req, { params }) => {

    const { 
        page,
        id
    } = await params

    const count = 10
    

    const post = await getPost(id)

    if (!post) return new Response("Post not found", { status: 404 })
    
    const posts = await getUserPosts(post.owner.id, id, count, page == 0 ? 0 : count * page)

    const res = posts.map(({ id, type, owner, height, width }: Post) => ({
        id,
        owner,
        uid: `${page}:${id}`,
        aspect: height/width,
        media: [
            {
                id,
                isVideo: type === MediaType.VIDEO ? true : false,
                metadata: {
                    height,
                    width
                }
            }
        ]
    }))

    return Response.json({
        page,
        hasMore: posts.length < count ? false : true,
        media: res,
    })

}