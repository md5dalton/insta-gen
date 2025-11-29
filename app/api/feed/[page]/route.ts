import { getRandom, MediaResponse } from "@/actions/media"
import { NextResponse } from "next/server"

export const GET = async (req, { params }): Promise<NextResponse> => {

    const { page } = await params

    const media = await getRandom()

    return NextResponse.json(media.map((m: MediaResponse) => ({...m, uid: `${page}:${m.id}`})))
}