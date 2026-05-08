import { getRandom, getUserReels, Reel } from "@/actions/reel"
import { withAuth } from "@/hooks/withAuth"
import { NextRequest } from "next/server"

export const GET = withAuth(async (req: NextRequest, { user }) => {

    const searchParams = req.nextUrl.searchParams

    const cursor = searchParams.get("cursor")
    const ownerId = searchParams.get("user")
    
    const userId = user.id
    
    let reels: Reel[] = []

    if (ownerId && cursor) {
        
        reels = await getUserReels(userId, ownerId, cursor)
        
    } else {

        reels = await getRandom(userId)

    }

    return Response.json({
        items: reels,
        nextCursor:
            reels.length === 10
                ? reels[reels.length - 1].id
                : null,
    })

})