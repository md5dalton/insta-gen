
import prisma from "@/lib/prisma"
import { MediaFilterParams, PaginatedResponse } from "@/types/types"

export const getMedia = async (params: MediaFilterParams = {}): Promise<PaginatedResponse<any>> => {
    const q: any = { ...params }

    const pageNum = parseInt((q.page as any) || "1", 10) || 1
    const limitNum = parseInt((q.limit as any) || "24", 10) || 24
    const skip = (pageNum - 1) * limitNum

    const where: any = {}

    // Soft deletion
    if (q.includeDeleted !== "true") {
        where.deletedAt = null
    }

    // Type filter
    if (q.type && q.type !== "ALL") where.type = q.type

    // Status filter (processingStatus or deleted)
    if (q.status && q.status !== "ALL") {
        if (q.status === "DELETED") {
            where.deletedAt = { not: null }
        } else {
            where.processingStatus = q.status
        }
    }

    // Hierarchy filters via user -> collection -> rootCollection
    if (q.userId) where.userId = q.userId
    if (q.collectionId) where.user = { collectionId: q.collectionId }
    if (q.rootCollectionId) where.user = { collection: { rootCollectionId: q.rootCollectionId } }

    // Text search will be applied after fetching (covers tags and related names)
    const sortBy = (q.sortBy as string) || "createdAt"
    const sortOrder = (q.sortOrder as string) || "desc"

    const orderBy: any = {}
    if (sortBy === "likes") orderBy.likesCount = sortOrder
    else orderBy[sortBy] = sortOrder

    const total = await prisma.mediaItem.count({ where })

    const recs: any[] = await prisma.mediaItem.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
            user: { include: { collection: { include: { rootCollection: true } } } },
            assets: true,
            allowedUsers: { select: { userId: true } },
            // mediaTag relation contains tag
            tags: { include: { tag: true } },
        },
    })

    // map to expected shape
    const items = recs.map((r: any) => {
        let processingError = null
        try {
            if (r.processingError) processingError = JSON.parse(r.processingError)
        } catch (e) {
            processingError = { stage: "unknown", message: String(r.processingError) }
        }

        return {
            id: r.id,
            name: r.path?.split("/").pop() || r.id,
            type: r.type,
            path: r.path,
            size: Number(r.size ?? 0n),
            width: r.width,
            height: r.height,
            duration: r.duration ?? undefined,
            bitrate: r.bitrate ?? undefined,
            mktime: String(r.mktime),
            createdAt: r.createdAt?.toISOString(),
            updatedAt: r.updatedAt?.toISOString(),
            deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null,
            userId: r.userId,
            userName: r.user?.username || r.user?.path || undefined,
            collectionId: r.user?.collectionId || undefined,
            collectionName: r.user?.collection?.path || undefined,
            rootCollectionId: r.user?.collection?.rootCollectionId || undefined,
            rootCollectionName: r.user?.collection?.rootCollection?.path || undefined,
            processingProfileId: r.processingProfileId || null,
            visibility: r.visibility || null,
            allowedUserIds: (r.allowedUsers || []).map((a: any) => a.userId),
            tags: (r.tags || []).map((t: any) => (t.tag ? t.tag.name : t.tagId)),
            likesCount: r.likesCount || 0,
            savesCount: r.savesCount || 0,
            thumbnailUrl: r.thumbnailUrl || "",
            previewUrl: r.previewUrl || "",
            assets: (r.assets || []).map((a: any) => ({ ...a, generatedAt: a.generatedAt ? a.generatedAt.toISOString() : undefined })),
            processingStatus: r.processingStatus,
            processingError,
        }
    })

    const totalPages = Math.ceil(total / limitNum)

    return {
        items,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
    }
}

export const exists = async (id: string): Promise<boolean> => {
    const count = await prisma.mediaItem.count({ where: { id } })

    return count ? true : false
}
