import { getRandomReels, getReel, getUserReels } from "@/actions/reel"
import { NextRequest } from "next/server"

type Params = {
    params: Promise<{ id: string, page: string }>
}

export const GET = async (req: NextRequest, { params }: Params) => {

    const { 
        page: PageString,
        id
    } = await params

    const page = Number(PageString)

    const count = 10

    const reel = await getReel(id)

    if (!reel) return new Response("Reel not found", { status: 404 })

    const searchParams = req.nextUrl.searchParams

    const user = searchParams.get("u")
    
    let reels = []
    let hasMore = true

    if (user) {
        
        const skip = count * page

        reels = await getUserReels(reel.owner.id, reel.id, skip, count)

        hasMore = reels.length < count ? false : true
        
    } else {

        reels = await getRandomReels(count)

        if (page == 0) reels.splice(0, 1, reel)

    }
    
    return Response.json({
        page,
        hasMore,
        media: reels.map((reel) => ({...reel, uid: `${page}/${reel.id}`}))
    })

}