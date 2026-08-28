import { NextResponse } from "next/server"
import { db } from "@/server/db"
import { authenticateRequest } from "@/server/auth"

export async function POST(request: Request) {
    const admin = await authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { path } = await request.json()
    if (!path || typeof path !== "string")
        return NextResponse.json({ error: "Valid path string is required" }, { status: 400 })
        const oldPath = db.settings.mediaRoot
        db.settings.mediaRoot = path.trim()
        await db.logActivity({ type: "SETTINGS_UPDATE", title: "Media root changed", description: `Media root changed from ${oldPath} -> ${db.settings.mediaRoot}` })
    return NextResponse.json({
        success: true,
        warning:
            "Changing the media root does not move existing media. The system will now scan this path.",
        settings: db.settings,
    })
}
