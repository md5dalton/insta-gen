import {
    MediaItem,
    EffectivePolicyResult,
    ProcessingProfile,
} from "@/types/types"
import { db } from "./db"
import { AssetStatus, AssetType, MediaType, UserRole, VisibilityType } from "@/prisma/generated/enums"


// --- Convenience helpers expected by API routes ---

export async function resolveEffectiveProfile(params: {
    mediaId?: string
    userId?: string
    collectionId?: string
    rootCollectionId?: string
    type?: "IMAGE" | "VIDEO"
}): Promise<ProcessingProfile> {
    const { mediaId, userId, collectionId, rootCollectionId, type = "IMAGE" } = params

    let chosenProfileId: string | null | undefined = null

    if (mediaId) {
        const m: any = await db.findMediaById(mediaId)
        if (m?.processingProfileId) chosenProfileId = m.processingProfileId
    }
    if (!chosenProfileId && userId) {
        const u: any = await db.findMediaUserById(userId)
        if (u?.processingProfileId) chosenProfileId = u.processingProfileId
    }
    if (!chosenProfileId && collectionId) {
        const c: any = await db.findCollectionById(collectionId)
        if (c?.processingProfileId) chosenProfileId = c.processingProfileId
    }
    if (!chosenProfileId && rootCollectionId) {
        const r: any = await db.findRootCollectionById(rootCollectionId)
        if (r?.processingProfileId) chosenProfileId = r.processingProfileId
    }

    let profile = db.profiles.find((p) => p.id === chosenProfileId)
    if (!profile) {
        const defaultProfileId = type === "VIDEO" ? "profile-video-feed" : "profile-image-feed"
        profile = db.profiles.find((p) => p.id === defaultProfileId) || db.profiles[0]
    }
    return profile
}

export async function resolveEffectiveVisibility(params: {
    mediaId?: string
    userId?: string
    collectionId?: string
    rootCollectionId?: string
}): Promise<"ALL_USERS" | "RESTRICTED" | "PRIVATE"> {
    const { mediaId, userId, collectionId, rootCollectionId } = params

    const m: any = mediaId ? await db.findMediaById(mediaId) : null
    const targetUserId = userId || m?.userId
    const u: any = targetUserId ? await db.findMediaUserById(targetUserId) : null
    const targetColId = collectionId || u?.collectionId || m?.collectionId
    const c: any = targetColId ? await db.findCollectionById(targetColId) : null
    const targetRootId = rootCollectionId || c?.rootCollectionId || m?.rootCollectionId
    const r: any = targetRootId ? await db.findRootCollectionById(targetRootId) : null

    const chain = [r?.visibility, c?.visibility, u?.visibility, m?.visibility].filter(
        Boolean as any
    )

    if (chain.includes("PRIVATE")) return "PRIVATE"

    for (let i = chain.length - 1; i >= 0; i--) {
        const v = chain[i]
        if (v && v !== "INHERIT") {
            return v as "ALL_USERS" | "RESTRICTED" | "PRIVATE"
        }
    }

    return "ALL_USERS"
}

export async function resolveEffectiveAllowedUsers(params: {
    mediaId?: string
    userId?: string
    collectionId?: string
    rootCollectionId?: string
}): Promise<string[]> {
    const { mediaId, userId, collectionId, rootCollectionId } = params

    const m: any = mediaId ? await db.findMediaById(mediaId) : null
    const targetUserId = userId || m?.userId
    const u: any = targetUserId ? await db.findMediaUserById(targetUserId) : null
    const targetColId = collectionId || u?.collectionId || m?.collectionId
    const c: any = targetColId ? await db.findCollectionById(targetColId) : null
    const targetRootId = rootCollectionId || c?.rootCollectionId || m?.rootCollectionId
    const r: any = targetRootId ? await db.findRootCollectionById(targetRootId) : null

    const nodes = [r, c, u, m].filter(Boolean as any)
    let currentAllowed: Set<string> | null = null

    for (const node of nodes) {
        if ((node as any).visibility === "PRIVATE") {
            return []
        } else if ((node as any).visibility === "RESTRICTED") {
            const allowedArr: string[] = (node as any).allowedUserIds || []
            const nodeSet = new Set<string>(allowedArr)
            if (currentAllowed === null) {
                currentAllowed = nodeSet
            } else {
                const next = new Set<string>()
                for (const uid of currentAllowed) {
                    if (nodeSet.has(uid)) next.add(uid)
                }
                currentAllowed = next
            }
        }
    }

    return currentAllowed ? Array.from(currentAllowed) : (await db.listProfileUsers()).map((p) => p.id)
}

export async function processMediaItemSync(media: MediaItem): Promise<MediaItem> {
    // Simple implementation: fill missing assets based on processing policy
    const policy: EffectivePolicyResult = resolveEffectiveProcessingPolicyForMedia(media)
    policy.missingAssets.forEach((assetType: AssetType) => {
        const assetId = `asset-${media.id}-${assetType.toLowerCase()}`
        const existingIdx = media.assets.findIndex((a) => a.type === assetType)
        const newAsset: any = {
            id: assetId,
            mediaId: media.id,
            type: assetType,
            status: "READY",
            path: `${media.path}_${assetType.toLowerCase()}.${assetType === "HLS" ? "m3u8" : "webp"}`,
            generatedAt: new Date().toISOString(),
        }
        if (existingIdx >= 0) media.assets[existingIdx] = newAsset
        else media.assets.push(newAsset)
        if (assetType === "THUMBNAIL") media.thumbnailUrl = media.previewUrl
    })
    media.processingStatus = "READY"
    media.processingError = null as any
    media.updatedAt = new Date().toISOString()
    return await enrichMediaItem(media)
}

export async function retryFailedAssetsSync(media: MediaItem): Promise<MediaItem> {
    media.assets.forEach((asset) => {
        if ((asset as any).status === "FAILED") {
            ;(asset as any).status = "READY"
            delete (asset as any).error
            ;(asset as any).generatedAt = new Date().toISOString()
        }
    })
    media.processingStatus = "READY"
    media.processingError = null as any
    media.updatedAt = new Date().toISOString()
    return await enrichMediaItem(media)
}
