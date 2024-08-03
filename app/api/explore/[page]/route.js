import { getPosts, getVideos } from "@/actions/random"

export async function GET(req, { params: { page } }) {

    const media = []
    const pageSize = 8

    const DBposts = await getPosts(pageSize)
    const DBvideos = await getVideos(2)

    const posts = DBposts.map(({ id, thumb, media }) => {

        const videos = media.filter(({ type }) => type == "VIDEO")

        return ({
            id,
            thumb,
            hasMany: media.length ? true : false,
            hasReel: videos.length ? true : false
        })

    })


    for (let i = 0; i < posts.length; i += 2) media.push(posts.slice(i, i + 2))

    if (DBvideos.length > 1) {

        media.splice(2, 0,
            [{reel: true, ...DBvideos.pop()}],
            [{reel: true, ...DBvideos.pop()}]
        )

    }
    
    return Response.json({
        media: media,
        page,
        end: false
    })

}