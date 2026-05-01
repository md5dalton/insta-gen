import { toggleLike, toggleSave } from "@/actions/activity"
import { withAuth } from "@/hooks/withAuth"
import { NextRequest, NextResponse } from "next/server"

export const POST = withAuth(async (req: NextRequest, { user }) => {

    const { postId: mediaId } = await req.json()
    
    const { searchParams } = new URL(req.url)
    
    const userId = user.id
    const action = searchParams.get("action")

    if (!action || !mediaId)  return new Response("Missing params", { status: 400 })
        
    let result = null

    switch (action) {
        case "like":
            result = await toggleLike(userId, mediaId)
            break 
        case "bookmark":
            result = await toggleSave(userId, mediaId)
            break 
    }
    
    return result !== null ?
        NextResponse.json({ success: true, result }) :
        NextResponse.json({ error: "Invalid request" }, { status: 400 })
})