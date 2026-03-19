import { getRandom, getUserReels, Reel } from "@/actions/reel"
import { NextRequest } from "next/server"

export const GET = async (req: NextRequest) => {

    const searchParams = req.nextUrl.searchParams

    const cursor = searchParams.get("cursor")
    const user = searchParams.get("user")
    
    let reels: Reel[] = []
    let nextCursor: string | null = null

    if (user && cursor) {
        
        reels = await getUserReels(user, cursor)

        if (reels.length === 10) nextCursor = reels[reels.length - 1].id
        
    } else {

        reels = await getRandom()

        nextCursor = reels[reels.length - 1].id
    }

    return Response.json({
        items: reels,
        nextCursor
    })

}