import { Post } from "@/actions/post"
import { getCursor, getTagPosts } from "@/actions/tag"
import { withAuth } from "@/hooks/withAuth"

export const GET = withAuth<{ id: string }>(async (req, { params, user }) => {

    const { id } = params

    const searchParams = req.nextUrl.searchParams

    const cursor = searchParams.get("cursor")

    let posts: Post[] = [] 

    if (cursor) {
        
        const cursorProps = await getCursor(cursor)
        
        if (!cursorProps) return new Response("cursor is invalid", { status: 400 })
        
        posts = await getTagPosts(user.id, id, cursorProps) || []

    } else {
        posts = await getTagPosts(user.id, id) || []
    }
    
    return Response.json({
        items: posts.map(({ type, ...rest }) => ({
            ...rest,
            mediaType: type
        })),
        nextCursor:
            posts.length === 10
                ? posts[posts.length - 1].id
                : null
    })

})