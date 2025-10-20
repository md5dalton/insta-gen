import { getPosts } from "@/actions/feed"

export async function GET(req, { params }) {

    const { page } = await params

    const DBposts = await getPosts()

    const posts = DBposts.map(({ media, ...rest }) => {
        
        const { metadata: { height, width } } = media.reduce((prev, current) => (prev.metadata.height > current.metadata.height) ? prev : current)
  
        return ({
            media,
            aspect: height/width,
            ...rest,
        })
    })

    const media = posts.map(item => ({...item, uid: `${page}/${item.id}`}))

    return Response.json(media)
}