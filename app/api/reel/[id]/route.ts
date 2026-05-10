import { getReel } from "@/actions/reel"
import withAuthParams from "@/hooks/withAuthParams"

export const GET = withAuthParams<{ id: string }>(async (req, { params, user }) => {

    const { id } = params

    const reel = await getReel(id, user.id)

    if (!reel) return new Response("Post not found", { status: 404 })

    return Response.json(reel)

})