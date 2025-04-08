import { getReel, getRelatedReels } from "@/actions/reel"

export async function GET(req, { params: { page, id } }) {

    const reel = page == 0 ? await getReel(id) : null
    const reels = await getRelatedReels(id)

    if (reel) reels.unshift(reel)

    const media = reels.map(({ owner, id, ...rest }) => ({...rest, id, owner: owner.owner, uid: `${page}/${id}`}))
    
    return Response.json(media)

}