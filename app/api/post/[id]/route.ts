import { getPost } from "@/actions/post"
import withAuthParams from "@/hooks/withAuthParams"

export const GET = withAuthParams(async (req, { params, user }) => {

    const { id } = params

    const post = await getPost(id, user.id)

    if (!post) return new Response("Post not found", { status: 404 })
    
    const { type, ...rest } = post
    
    return Response.json({
        mediaType: type,
        ...rest
    })

})