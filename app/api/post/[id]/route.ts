import { getPost } from "@/actions/post"
import { ParamsId } from "@/types/type"
import { NextRequest } from "next/server"

export const GET = async (req: NextRequest, { params }: ParamsId) => {

    const { id } = await params

    const post = await getPost(id)

    if (!post) return new Response("Post not found", { status: 404 })

    return Response.json(post)
}