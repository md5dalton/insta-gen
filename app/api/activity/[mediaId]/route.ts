import { likePost, unLikePost } from "@/actions/activity"
import { withAuth } from "@/hooks/withAuth"
import { NextRequest, NextResponse } from "next/server"

export const GET = withAuth(async (req: NextRequest, { user, params }) => {

    const { 
        mediaId
    } = await params

    const { searchParams } = new URL(req.url)

    const action = searchParams.get("action")

    if (!action)  return new Response("Missing params", { status: 400 })
        
    let result = null

    switch (action) {
        case "like":
            result = await likePost(user.userId, mediaId)
            break 
        case "unlike":
            result = await unLikePost(user.userId, mediaId)
            break 
        }
        
    return result ?
        NextResponse.json({ success: true, result }) :
        NextResponse.json({ error: "Invalid request" }, { status: 400 })
})