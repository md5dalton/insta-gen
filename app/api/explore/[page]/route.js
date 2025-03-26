import { getPosts, getVideos } from "@/actions/random"
import { arrayColumn, encode } from "@/utils/functions"

export async function GET(req, { params: { page } }) {

    const media = []
    const pageSize = 8

    const DBposts = await getPosts(pageSize)
    const DBvideos = await getVideos(2)

    const posts = DBposts.map(({ id, thumb, media }) => {

        const videos = media.filter(({ isVideo }) => isVideo)

        return ({
            id,
            thumb,
            hasMany: media.length > 1,
            hasReel: videos.length ? true : false
        })

    })


    for (let i = 0; i < posts.length; i += 2) {
        
        const postSlice = posts.slice(i, i + 2)

        media.push({
            id: encode(arrayColumn(postSlice, "id").join()),
            posts: postSlice
        })
    
    }

    if (DBvideos.length > 1) {

        const [ reel1, reel2 ] = DBvideos

        media.splice(2, 0,
            {
                id: reel1.id,
                posts: [{isReel: true, ...reel1}]
            },
            {
                id: reel2.id,
                posts: [{isReel: true, ...reel2}]
            },
        )

    }
    
    return Response.json({
        media: media,
        page,
        end: false
    })

}