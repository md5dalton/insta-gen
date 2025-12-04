import { getRandom } from "@/actions/media"

type Person = {
    id: string
    name: string
    picture: string | null
}
type Media = {
    id: string
    isVideo: boolean
    metadata: {
        width: number
        height: number
    }
}

type Post = {
    id: string
    uid: string
    owner: Person
    aspect: number
    media: Media[]
}
export const GET = async (req, { params }) => {

    const { page } = await params

    const media = await getRandom()

    const res = media.map((m) => ({
        id: m.id,
        uid: `${page}:${m.id}`,
        owner: m.owner,
        // metadata: m.metadata,
        aspect: m.metadata ? m.metadata.height/m.metadata.width : 0,
        media: [
            {
                id: m.id,
                isVideo: m.isVideo,
                metadata: m.metadata
            }
        ]
    }))

    return Response.json(res)
}