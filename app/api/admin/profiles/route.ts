import { NextResponse } from "next/server"
import { db } from "@/server/db"
import { authenticateRequest } from "@/server/auth"

export async function GET() {
    return NextResponse.json(db.profiles)
}

export async function POST(request: Request) {
    const admin = authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name, description, requiredRenditions } = await request.json()
    if (!name) return NextResponse.json({ error: "Profile name is required" }, { status: 400 })

    const profile: any = {
        id: `prof-${Date.now()}`,
        name,
        description: description || "",
        isSystem: false,
        requiredRenditions: {
            thumbnail: true,
            feedImage: Boolean(requiredRenditions?.feedImage),
            hls: Boolean(requiredRenditions?.hls),
            lowQuality: Boolean(requiredRenditions?.lowQuality),
        },
    }
    db.profiles.push(profile)
    db.recentActivity.unshift({
        id: `act-${Date.now()}`,
        type: "POLICY_CHANGE",
        title: "Processing profile created",
        description: `Created profile "${profile.name}"`,
        timestamp: new Date().toISOString(),
    })
    return NextResponse.json(profile, { status: 201 })
}
