import { NextResponse } from "next/server"
import { db } from "@/server/db"
import { authenticateRequest } from "@/server/auth"
import { create, list } from "@/lib/db/admin/processingProfile"
import { AssetType } from "@/types/types"

export async function GET() {
    return NextResponse.json(await list())
}

export async function POST(request: Request) {
    const admin = await authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name, description, renditions } = await request.json()
    if (!name || !description || !renditions.length) return NextResponse.json({ error: "Missing profile data" }, { status: 400 })

    const normalizedRenditions: AssetType[] = Array.isArray(renditions)
        ? renditions.filter((value: unknown): value is AssetType => value === "THUMBNAIL" || value === "FEED_IMAGE" || value === "HLS")
        : ["THUMBNAIL"]

    const created = await create(name, description, normalizedRenditions)
    
    await db.logActivity({ type: "POLICY_CHANGE", title: "Processing profile created", description: `Created profile "${created.name}"` })
    
    return NextResponse.json(created, { status: 201 })
}
