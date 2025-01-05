import { getPosts } from "@/actions/feed"

export async function GET(req, { params: { page } }) {

    const DBposts = await getPosts()

    return Response.json({
        media: DBposts,
        page,
        end: false
    })

}