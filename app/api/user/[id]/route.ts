import { getUser, getUserStats } from "@/actions/user"

export const GET = async (req, { params }) => {

    const { id } = await params

    const user = await getUser(id)
    // const stats = await getUserStats(id)

    if (!user) return new Response("User not found", { status: 404 })

    return Response.json({
        id: user.id,
        name: user.name,
        picture: user.picture,
        stats: {
            posts: user._count.media,
            followers: "347k",
            following: 143
        }
    })
}