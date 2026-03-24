import { getRandom, getUserReels, Reel } from "@/actions/reel"
import { NextRequest } from "next/server"

export const GET = async (req: NextRequest) => {

    const searchParams = req.nextUrl.searchParams

    const cursor = searchParams.get("cursor")
    const user = searchParams.get("user")
    
    let reels: Reel[] = []

    if (user && cursor) {
        
        reels = await getUserReels(user, cursor)
        
    } else {

        reels = await getRandom()

    }

    return Response.json({
        items: reels,
        nextCursor:
            reels.length === 10
                ? reels[reels.length - 1].id
                : null,
    })

}