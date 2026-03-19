import { getPost, getRandom, getUserPosts, Post } from "@/actions/post"
import { NextRequest } from "next/server"

export const GET = async (req: NextRequest) => {

    const searchParams = req.nextUrl.searchParams

    const cursor = searchParams.get("cursor")
    const user = searchParams.get("user")
    
    let posts: Post[] = []

    if (user && cursor) {

        const post = await getPost(cursor)

        if (!post) return new Response("Provide Post not found", { status: 400 })

        posts = await getUserPosts(post.owner.id, post.id)
    
    } else {
        posts = await getRandom()
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

}