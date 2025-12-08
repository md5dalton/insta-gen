import { getReel, getRelatedReels } from "@/actions/reel"

export const GET = async (req, { params }) => {

    const { 
        page,
        id
     } = await params

    const reel = page == 0 ? await getReel(id) : null
    const reels = await getRelatedReels(id)

    if (reel) {
        reels.pop()
        reels.unshift(reel)
    }

    const media = reels.map((reel) => ({...reel, uid: `${page}/${reel.id}`}))

    return Response.json(media)

}