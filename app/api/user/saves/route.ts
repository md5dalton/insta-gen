import { getSave, getSavedPosts, Post } from "@/actions/user"
import withAuth from "@/hooks/withAuth"

export const GET = withAuth(async (req, { user }) => {

    const searchParams = req.nextUrl.searchParams

    const cursor = searchParams.get("cursor")
    
    const userId = user.id

    let media: Post[] = []

    if (cursor) {
        const save = await getSave(userId, cursor)
        if (!save) return new Response("Cursor not found", { status: 404 })

        media = await getSavedPosts(userId, save)
        
    } else {
        media = await getSavedPosts(userId)
    }

    return Response.json({
        items: media,
        nextCursor:
            media.length === 10
                ? media[media.length - 1].id
                : null
    })
    
})