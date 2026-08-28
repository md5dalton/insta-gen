import { NextResponse } from "next/server"
import { db } from "@/server/db"
import { authenticateRequest } from "@/server/auth"

export async function POST(request: Request) {
    const admin = await authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { collectionId, username, displayName, processingProfileId, visibility, allowedUserIds } =
        await request.json()
    if (!collectionId || !username)
        return NextResponse.json(
            { error: "collectionId and username are required" },
            { status: 400 }
        )
    const colExists = await db.findCollectionById(collectionId)
    if (!colExists) return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    const cleanUsername = username
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "_")
    const created = await db.createMediaUser({
        collectionId,
        username: cleanUsername,
        displayName: displayName ? displayName.trim() : cleanUsername,
        processingProfileId: processingProfileId || null,
        visibility: visibility || null,
        allowedUserIds: allowedUserIds || [],
    })
    await db.logActivity({ type: "POLICY_CHANGE", title: "Media User registered", description: `Registered user "@${created?.username}" under collection "${colExists.name}"` })
    return NextResponse.json(created, { status: 201 })
}
