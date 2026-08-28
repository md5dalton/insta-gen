import { NextResponse } from "next/server"
import { db } from "@/server/db"
import { authenticateRequest } from "@/server/auth"

export async function GET() {
    return NextResponse.json(await db.listProcessingProfiles())
}

export async function POST(request: Request) {
    const admin = await authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name, description, requiredRenditions } = await request.json()
    if (!name) return NextResponse.json({ error: "Profile name is required" }, { status: 400 })

    const created = await db.createProcessingProfile({ name, description: description || "", requiredRenditions: { thumbnail: true, feedImage: Boolean(requiredRenditions?.feedImage), hls: Boolean(requiredRenditions?.hls), lowQuality: Boolean(requiredRenditions?.lowQuality) } })
    await db.logActivity({ type: "POLICY_CHANGE", title: "Processing profile created", description: `Created profile "${created.name}"` })
    return NextResponse.json(created, { status: 201 })
}
