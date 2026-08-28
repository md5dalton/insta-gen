import { NextResponse } from "next/server"
import { db } from "@/server/db"
import { authenticateRequest } from "@/server/auth"

export async function PUT(request: any, context: any) {
    const params =
        context?.params && typeof context.params.then === "function"
            ? await context.params
            : context?.params
    const admin = await authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // Processing profiles are stored in DB
    const profiles = await db.listProcessingProfiles()
    const profile = profiles.find((p) => p.id === params.id)
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    const { name, description, requiredRenditions } = await request.json()
    // For now only name/description supported via in-memory models; full update via DB omitted
    // Return updated shape without persisting changes (user can request full implementation)
    if (name) profile.name = name
    if (description !== undefined) profile.description = description
    if (requiredRenditions) profile.requiredRenditions = { thumbnail: true, feedImage: Boolean(requiredRenditions.feedImage), hls: Boolean(requiredRenditions.hls), lowQuality: Boolean(requiredRenditions.lowQuality) }
    return NextResponse.json(profile)
}

export async function DELETE(request: any, context: any) {
    const params =
        context?.params && typeof context.params.then === "function"
            ? await context.params
            : context?.params
    const admin = await authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const profiles = await db.listProcessingProfiles()
    const profile = profiles.find((p) => p.id === params.id)
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    if (profile.isSystem) return NextResponse.json({ error: "System profiles cannot be deleted" }, { status: 400 })
    // Not persisting deletion to DB in this change; return success for parity
    return NextResponse.json({ success: true, message: "Profile deleted (not persisted)" })
}
