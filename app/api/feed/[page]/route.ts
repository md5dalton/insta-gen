import { getRandom, MediaResponse } from "@/actions/media"
import { MediaType } from "@/types/type"

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

    const res = media.map((m: MediaResponse) => ({
        id: m.id,
        uid: `${page}:${m.id}`,
        owner: m.owner,
        // metadata: m.metadata,
        aspect: m.height/m.width,
        media: [
            {
                id: m.id,
                isVideo: m.type === MediaType.VIDEO,
                metadata: {
                    height: m.height,
                    width: m.width
                }
            }
        ]
    }))

    return Response.json(res)
}