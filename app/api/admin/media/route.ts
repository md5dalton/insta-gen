import { NextResponse } from "next/server"
import { db } from "@/server/db"
import { enrichMediaItem } from "@/server/policy"
import { authenticateRequest } from "@/server/auth"

export async function GET(request: Request) {
    const url = new URL(request.url)
    const q = Object.fromEntries(url.searchParams.entries())

    let results = await Promise.all((await db.listMedia()).map((m) => enrichMediaItem({
        ...m,
        mktime: String(m.mktime),
        size: String(m.size),
    })))

    // Soft deletion filtering
    if (q.includeDeleted !== "true") {
        results = results.filter((m) => !m.isEffectivelyDeleted)
    }

    // Text search
    if (q.query) {
        const term = (q.query as string).toLowerCase()
        results = results.filter(
            (m) =>
                m.name.toLowerCase().includes(term) ||
                m.path.toLowerCase().includes(term) ||
                (m.userName || "").toLowerCase().includes(term) ||
                (m.tags || []).some((t: string) => t.toLowerCase().includes(term))
        )
    }

    // Basic filters (type, status, collection, user, profile, tag)
    if (q.type) results = results.filter((m) => m.type === q.type)
    if (q.status) results = results.filter((m) => m.processingStatus === q.status)
    if (q.rootCollectionId)
        results = results.filter((m) => m.rootCollectionId === q.rootCollectionId)
    if (q.collectionId) results = results.filter((m) => m.collectionId === q.collectionId)
    if (q.userId) results = results.filter((m) => m.userId === q.userId)
    if (q.profileId) results = results.filter((m) => m.effectivePolicy?.profile.id === q.profileId)
    if (q.tag) results = results.filter((m) => (m.tags || []).includes(q.tag as string))

    // Sorting
    const sortBy = (q.sortBy as string) || "createdAt"
    const sortOrder = (q.sortOrder as string) || "desc"
    results.sort((a: any, b: any) => {
        let valA = a[sortBy] ?? ""
        let valB = b[sortBy] ?? ""
        if (sortBy === "likes") {
            valA = a.likesCount
            valB = b.likesCount
        }
        if (valA < valB) return sortOrder === "asc" ? -1 : 1
        if (valA > valB) return sortOrder === "asc" ? 1 : -1
        return 0
    })

    const pageNum = parseInt((q.page as string) || "1", 10) || 1
    const limitNum = parseInt((q.limit as string) || "24", 10) || 24
    const total = results.length
    const totalPages = Math.ceil(total / limitNum)
    const offset = (pageNum - 1) * limitNum
    const paginated = results.slice(offset, offset + limitNum)

    console.log(paginated)
    return NextResponse.json({
        items: paginated,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
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
