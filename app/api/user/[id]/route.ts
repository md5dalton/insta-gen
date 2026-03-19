import { getUser } from "@/actions/user"
import { ParamsId } from "@/types/type"
import { NextRequest } from "next/server"

export const GET = async (req: NextRequest, { params }: ParamsId) => {

    const { id } = await params

    const user = await getUser(id)

    if (!user) return new Response("User not found", { status: 404 })

    return Response.json({
        id: user.id,
        name: user.name,
        picture: user.picture
    })
}