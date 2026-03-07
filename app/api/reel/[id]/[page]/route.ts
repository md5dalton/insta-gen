import { getRandomReels, getReel, getUserReels } from "@/actions/reel"
import { NextRequest } from "next/server"

type Params = {
    params: Promise<{ id: string, page: number }>
}

export const GET = async (req: NextRequest, { params }: Params) => {

    const { 
        page,
        id
    } = await params

    const count = 10

    const reel = await getReel(id)

    if (!reel) return new Response("Reel not found", { status: 404 })

    const searchParams = req.nextUrl.searchParams

    const user = searchParams.get("u")
    
    let reels = []

    if (user) {
        
        const skip = count * page

        reels = await getUserReels(reel.owner.id, reel.id, skip, count)
        
    } else {

        reels = await getRandomReels(count)

        if (page == 0) reels.splice(0, 1, reel)

    }
     
    const media = reels.map((reel) => ({...reel, uid: `${page}/${reel.id}`}))

    return Response.json(media)

}