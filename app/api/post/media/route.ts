import { getPost, getRandom, getUserPosts, Post } from "@/actions/post"
import { NextRequest } from "next/server"
import withAuthParams from "@/hooks/withAuthParams"

export const GET = withAuthParams(async (req: NextRequest, { user }) => {

    const searchParams = req.nextUrl.searchParams

    const cursor = searchParams.get("cursor")
    const ownerId = searchParams.get("user")

    const userId = user.id

    let posts: Post[] = []

    if (ownerId && cursor) {

        const post = await getPost(cursor, userId)

        if (!post) return new Response("Provide Post not found", { status: 400 })

        posts = await getUserPosts(userId, post.owner.id, post.id)
    
    } else {
        posts = await getRandom(userId)
    }

    return Response.json({
        items: posts.map(({ type, ...rest }: Post) => ({
            ...rest,
            mediaType: type
        })),
        nextCursor:
            posts.length === 10
                ? posts[posts.length - 1].id
                : null,
    })

})