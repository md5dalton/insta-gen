import { getPosts } from "@/actions/user"

export async function GET(req, props) {
    const params = await props.params;

    const {
        page,
        id
    } = params;

    const DBposts = await getPosts(id, page)

    const posts = DBposts.map(({ media, ownerId, ...post }) => {

        const videos = media.filter(({ type }) => type == "VIDEO")

        return ({
            ...post,
            user: ownerId,
            hasMany: media.length > 1,
            hasReel: videos.length ? true : false
        })

    })

    return Response.json({
        media: posts,
        page,
        end: DBposts.length < 11
    })
}