import { getUser, getUserStats } from "@/actions/user"
import { MediaType } from "@/prisma/generated/enums"
import { ParamsId } from "@/types/type"
import { NextRequest } from "next/server"

export const GET = async (req: NextRequest, { params }: ParamsId) => {

    const { id } = await params

    const user = await getUser(id)

    if (!user) return new Response("User not found", { status: 404 })

    const stats = await getUserStats(user.id)

    const counts = {
        posts: 0,
        reels: 0,
    }

    for (const item of stats) {
        if (item.type === MediaType.IMAGE) counts.posts = item._count.type
        if (item.type === MediaType.VIDEO) counts.reels = item._count.type
    }

    return Response.json({
        id: user.id,
        name: user.name,
        picture: user.picture,
        user,
        stats: counts
    })
}