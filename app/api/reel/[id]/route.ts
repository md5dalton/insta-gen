import { getReel } from "@/actions/reel"
import { ParamsId } from "@/types/type"
import { NextRequest } from "next/server"

export const GET = async (req: NextRequest, { params }: ParamsId) => {

    const { id } = await params

    const reel = await getReel(id)

    if (!reel) return new Response("Post not found", { status: 404 })

    return Response.json(reel)
}