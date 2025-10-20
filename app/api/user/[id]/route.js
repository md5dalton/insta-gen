import { getUser } from "@/actions/user"

export async function GET(req, props) {
    const params = await props.params;

    const {
        id
    } = params;

    const DBuser = await getUser(id)

    if (!DBuser) return new Response("User not found", { status: 404 })

    const { posts, ...user } = DBuser

    console.log(DBuser)

    return Response.json({
        ...user,
        stats: {
            posts: posts.length,
            followers: "347k",
            following: 143
        }
    })
}