import { NextResponse } from "next/server"
import { db } from "@/server/db"
import { getMedia } from "@/lib/db/admin/media"
import { enrichMediaItem } from "@/server/policy"
import { authenticateRequest } from "@/server/auth"

export async function GET(request: Request) {
    const url = new URL(request.url)
    const q = Object.fromEntries(url.searchParams.entries())

    // Use DB helper to fetch paginated, filtered media
    const result = await getMedia(q as any)

    // Enrich each media item with policy/access info
    const items = await Promise.all(
        (result.items || []).map((m: any) =>
            enrichMediaItem({
                ...m,
                mktime: String(m.mktime),
                size: String(m.size),
            })
        )
    )

    return NextResponse.json({
        items,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
    })
}

export async function POST(request: Request) {
    // require admin
    const auth = request.headers.get("authorization") || undefined
    const admin = await authenticateRequest(auth)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const {
        name,
        type,
        userId,
        collectionId,
        rootCollectionId,
        size,
        width,
        height,
        duration,
        bitrate,
        tags,
        previewUrl,
        thumbnailUrl,
        processingProfileId,
        visibility,
        allowedUserIds,
    } = body as any

    if (!name || !userId || !collectionId || !rootCollectionId) {
        return NextResponse.json(
            { error: "name, userId, collectionId, and rootCollectionId are required" },
            { status: 400 }
        )
    }

    const collections = await db.listCollections()
    const rootCollections = await db.listRootCollections()
    const mediaUsers = await db.listMediaUsers()
    const collection = collections.find((c) => c.id === collectionId)
    const rootCollection = rootCollections.find((r) => r.id === rootCollectionId)
    const user = mediaUsers.find((u) => u.id === userId)

    const mediaId = `media-${Date.now()}`
    const mediaType = (type || (name.match(/\.(mp4|mov|mkv|webm)$/i) ? "VIDEO" : "IMAGE")) as any
    const path = `${rootCollection?.path || "root"}/${collection?.path || "col"}/${user?.username || "user"}/${name}`

    const created = await db.createMedia({
        name: name.trim(),
        type: mediaType as any,
        path,
        size: size || 1024000,
        width: width || 1920,
        height: height || 1080,
        duration: duration || (mediaType === "VIDEO" ? 30 : undefined),
        bitrate: bitrate || (mediaType === "VIDEO" ? 12000 : undefined),
        userId,
        collectionId,
        rootCollectionId,
        processingProfileId: processingProfileId || null,
        visibility: visibility || null,
        allowedUserIds: allowedUserIds || [],
        tags: Array.isArray(tags) ? tags : [],
        previewUrl: previewUrl ||
            "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80",
        thumbnailUrl: thumbnailUrl || "",
        assets: [],
    })

    await db.logActivity({ type: "DISCOVERY", title: "New media ingested", description: `Discovered and cataloged ${created?.name} in ${path}` })

    return NextResponse.json(await enrichMediaItem(created), { status: 201 })
}
