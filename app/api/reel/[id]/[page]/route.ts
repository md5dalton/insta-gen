import { getPosts } from "@/actions/feed"
import { getReel, getRelatedReels, getUserReels, Reel } from "@/actions/reel"
import { NextRequest } from "next/server"

export const GET = async (req: NextRequest, { params }) => {

    const { 
        page,
        id
    } = await params

    // let media: Reel[] = []

    const count = 10

    // const searchParams = req.nextUrl.searchParams

    // const user = searchParams.get("u")
    
    // if (user) {
        
    //     const skip = page == 0 ? 0 : count * page

    //     media = await getUserReels(user, id, skip, count)

    // }
     
     
         
    const reel = page == 0 ? await getReel(id) : null
    const reels = await getRelatedReels(id, count)

    if (reel) {
        reels.pop()
        reels.unshift(reel)
    }

    const media = reels.map((reel) => ({...reel, uid: `${page}/${reel.id}`}))


    return Response.json(media)

}