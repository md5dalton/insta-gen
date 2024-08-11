import { getUser } from "@/actions/user"

export async function GET(req, { params: { id } }) {
    
    const DBuser = await getUser(id)
    
    if (!DBuser) return new Response("User not found", { status: 404 })

    const { posts, ...user } = DBuser

    console.log(DBuser)
    
    return Response.json({
        user: {
            ...user,
            stats: [
                {name: "posts", value: posts.length},
                {name: "followers", value: "347k"},
                {name: "following", value: "143"}
            ]
        }
    })

}