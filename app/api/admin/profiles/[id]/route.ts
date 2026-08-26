import { NextResponse } from "next/server"
import { db } from "@/server/db"
import { authenticateRequest } from "@/server/auth"

export async function PUT(request: any, context: any) {
    const params =
        context?.params && typeof context.params.then === "function"
            ? await context.params
            : context?.params
    const admin = authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const profile = db.profiles.find((p) => p.id === params.id)
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

    const { name, description, requiredRenditions } = await request.json()
    if (name) profile.name = name
    if (description !== undefined) profile.description = description
    if (requiredRenditions) {
        profile.requiredRenditions = {
            thumbnail: true,
            feedImage: Boolean(requiredRenditions.feedImage),
            hls: Boolean(requiredRenditions.hls),
            lowQuality: Boolean(requiredRenditions.lowQuality),
        }
    }
    return NextResponse.json(profile)
}

export async function DELETE(request: any, context: any) {
    const params =
        context?.params && typeof context.params.then === "function"
            ? await context.params
            : context?.params
    const admin = authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const profile = db.profiles.find((p) => p.id === params.id)
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    if (profile.isSystem)
        return NextResponse.json({ error: "System profiles cannot be deleted" }, { status: 400 })
    db.profiles = db.profiles.filter((p) => p.id !== params.id)
    return NextResponse.json({ success: true, message: "Profile deleted" })
}
