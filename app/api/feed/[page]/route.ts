import { getRandom, MediaResponse } from "@/actions/media"
import { NextResponse } from "next/server"
export const runtime = "nodejs"

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
export const GET = async (req, { params }): Promise<NextResponse<Post[]>> => {

    const { page } = await params

    const media = await getRandom()

    return NextResponse.json(media.map((m: MediaResponse) => ({
        id: m.id,
        uid: `${page}:${m.id}`,
        owner: m.owner,
        aspect: m.metadata.height/m.metadata.width,
        media: [
            {
                id: m.id,
                isVideo: m.isVideo,
                metadata: m.metadata
            }
        ]
    })))
}