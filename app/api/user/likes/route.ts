import { getLike, getLikedPosts, LikedPost } from "@/actions/user"
import { withAuth } from "@/hooks/withAuth"

export const GET = withAuth<{ id: string }>(async (req, { user }) => {

    const searchParams = req.nextUrl.searchParams

    const cursor = searchParams.get("cursor")
    
    const userId = user.id

    let media: LikedPost[] = []

    if (cursor) {
        const like = await getLike(userId, cursor)
        if (!like) return new Response("Cursor not found", { status: 404 })

        media = await getLikedPosts(userId, like)
        
    } else {
        media = await getLikedPosts(userId)
    }

    return Response.json({
        items: media,
        nextCursor:
            media.length === 10
                ? media[media.length - 1].id
                : null
    })
    
})