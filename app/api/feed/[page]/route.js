import { getPosts } from "@/actions/feed"
import { metadata } from "@/app/layout"

export async function GET(req, { params: { page } }) {

    const DBposts = await getPosts()

    const media = DBposts.map(({ media, ...rest }) => {
        
        const { metadata: { height, width } } = media.reduce((prev, current) => (prev.metadata.height > current.metadata.height) ? prev : current)
  
        // const height = Math.max(...media.map(({ metadata: { height } }) => height))

        return ({
            ...rest,
            // height,
            aspect: height/width,
            media
        })
    })

    return Response.json({
        media: media,
        page,
        end: false
    })

}