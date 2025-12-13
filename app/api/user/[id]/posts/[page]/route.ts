import { getPosts } from "@/actions/user"

export const GET = async (req, { params }) => {

    const { 
        page,
        id
    } = await params

    const count = 10
    
    const posts = await getPosts(id, count, page == 0 ? 0 : count * page)

    return Response.json({
        page,
        hasMore: posts.length < count ? false : true,
        endReached: posts.length < count,
        media: posts.map(({ id }) => ({
            id,
            uid: `${page}:${id}` ,
        }))
    })
}