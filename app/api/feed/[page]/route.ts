import { getRandom, MediaResponse } from "@/actions/media"
import { ParamsPage } from "@/types/type"
import { NextRequest } from "next/server"

export const GET = async (req: NextRequest, { params }: ParamsPage) => {

    const { page } = await params

    const media = await getRandom()

    const res = media.map(({ type, ...rest }: MediaResponse) => ({
        ...rest,
        uid: `${page}:${rest.id}`,
        mediaType: type
    }))
    
    return Response.json(res)
}