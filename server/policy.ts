import {
    MediaItem,
    EffectivePolicyResult,
    EffectiveAccessResult,
    ProcessingProfile,
    ProfileUser,
} from "@/types/types"
import { db } from "./db"
import prisma from "@/lib/prisma"
import { AssetStatus, AssetType, MediaType, UserRole, VisibilityType } from "@/prisma/generated/enums"
import { sep } from "node:path"
import { processingProfile as processingProfileDefault } from "@/constants/models"
import { MediaAsset, ProcessingProfile as ProcessingProfilePrisma } from "@/prisma/generated/client"

/**
 * Resolves the deterministic effective processing policy for a media item.
 * Precedence: Media -> User -> Collection -> Root Collection -> System default.
 */

interface EffectiveItem {
    id: string,
    path: string,
    processingProfile: ProcessingProfile | null,
    visibility: VisibilityType
    deletedAt: Date | null
    allowedUsers: { 
        id: string
        name: string
        role: UserRole
    }[]
}

interface EffectiveRootCollection extends EffectiveItem {}
interface EffectiveCollection extends EffectiveItem {
    rootCollection: EffectiveRootCollection
}
interface EffectiveUser extends EffectiveItem {
    collection: EffectiveCollection
}
export interface EffectiveMedia extends EffectiveItem {
    user: EffectiveUser
    type: MediaType,
    assets: MediaAsset[],
}


/**
 * Resolves deterministic access inheritance and parent restriction intersection.
 * Hierarchy: Root Collection -> Collection -> User -> Media
 * Rule: Child can restrict further, but cannot bypass a parent restriction.
 * Effective access = parent access ∩ child access.
 */
export function resolveEffectiveAccess(media: EffectiveMedia, profileUsers: ProfileUser[]): EffectiveAccessResult {
    
    const user = media.user
    const collection = user.collection
    const rootCollection = collection.rootCollection

    // 1. Resolve visibility precedence
    let effectiveVisibility: "ALL_USERS" | "RESTRICTED" | "PRIVATE" = "ALL_USERS"
    let inheritedFrom: EffectiveAccessResult["inheritedFrom"] = undefined

    const chain = [
        {
            level: "ROOT_COLLECTION" as const,
            name: rootCollection.path.split(sep).pop(),
            vis: rootCollection.visibility,
            allowed: rootCollection.allowedUsers.map(({ id }) => id),
        },
        {
            level: "COLLECTION" as const,
            name: collection.path.split(sep).pop(),
            vis: collection.visibility,
            allowed: collection.allowedUsers.map(({ id }) => id),
        },
        {
            level: "USER" as const,
            name: user.path.split(sep).pop(),
            vis: user.visibility,
            allowed: user.allowedUsers.map(({ id }) => id),
        },
        {
            level: "MEDIA" as const,
            name: media.path.split(sep).pop(),
            vis: media.visibility,
            allowed: media.allowedUsers.map(({ id }) => id),
        },
    ]

    // Most specific non-inherit visibility determines base policy
    let baseVisibilityLevel = chain[0]
    for (const item of chain) {
        if (item.vis && item.vis !== "INHERIT") {
            effectiveVisibility = item.vis
            baseVisibilityLevel = item
        }
    }

    if (baseVisibilityLevel.level !== "MEDIA") {
        inheritedFrom = {
            level: baseVisibilityLevel.level,
            name: `${baseVisibilityLevel.level.replace("_", " ")} → ${baseVisibilityLevel.name}`,
        }
    }

    // If any parent is PRIVATE, effective visibility is locked to PRIVATE
    if (chain.some((c) => c.vis === "PRIVATE")) {
        effectiveVisibility = "PRIVATE"
    }

    // 2. Compute parent allowed sets for intersection
    // Start with all users permitted if Root is ALL_USERS or empty restricted
    let currentAllowedSet: Set<string> | null = null // null means unrestricted (ALL_USERS)

    for (const node of chain) {
        if (node.vis === "PRIVATE") {
            currentAllowedSet = new Set() // No regular users allowed
            break
        } else if (node.vis === "RESTRICTED") {
            const nodeAllowed = new Set<string>(node.allowed || [])
            if (currentAllowedSet === null) {
                currentAllowedSet = nodeAllowed
            } else {
                // Intersection: current ∩ node
                const nextSet = new Set<string>()
                for (const uid of currentAllowedSet) {
                    if (nodeAllowed.has(uid)) {
                        nextSet.add(uid)
                    }
                }
                currentAllowedSet = nextSet
            }
        }
        // If INHERIT or ALL_USERS, leaves existing restriction in place
    }

    const effectiveUsers = profileUsers.map((pUser) => {
        if (pUser.role === "ADMIN") {
            return {
                user: pUser,
                allowed: true, // Admin always bypasses restrictions
            }
        }

        if (effectiveVisibility === "PRIVATE") {
            return {
                user: pUser,
                allowed: false,
                blockedByParent: true,
                parentBlockReason: "Entity visibility is set to Private (Admin only).",
            }
        }

        if (effectiveVisibility === "ALL_USERS" && currentAllowedSet === null) {
            return {
                user: pUser,
                allowed: true,
            }
        }

        // Check if user is in restricted set
        const isAllowed = currentAllowedSet ? currentAllowedSet.has(pUser.id) : true

        // Check if blocked by parent restriction
        let blockedByParent = false
        let parentBlockReason = undefined

        if (!isAllowed) {
            // Check which parent blocked them
            if (
                rootCollection?.visibility === "RESTRICTED" &&
                !rootCollection.allowedUsers.map(({ id }) => id).includes(pUser.id)
            ) {
                blockedByParent = true
                parentBlockReason = `Parent Root Collection '${rootCollection.path.split(sep).pop()}' does not permit access for ${pUser.name}.`
            } else if (
                collection?.visibility === "RESTRICTED" &&
                !collection.allowedUsers.map(({ id }) => id).includes(pUser.id)
            ) {
                blockedByParent = true
                parentBlockReason = `Parent Collection '${collection.path.split(sep).pop()}' does not permit access for ${pUser.name}.`
            } else if (
                media.visibility === "RESTRICTED" &&
                !media.allowedUsers.map(({ id }) => id).includes(pUser.id)
            ) {
                blockedByParent = false
                parentBlockReason = `Media access list does not include ${pUser.name}.`
            }
        }

        return {
            user: pUser,
            allowed: isAllowed,
            blockedByParent,
            parentBlockReason,
        }
    })

    return {
        visibility: effectiveVisibility,
        inheritedFrom,
        effectiveUsers,
    }
}

/**
 * Resolves effective deletion state by checking item and all parent levels.
 */


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

export function resolveEffectiveDeletion(media: EffectiveMedia): { isEffectivelyDeleted: boolean; deletionSource?: string; deletedAt?: string | null } {

    const user = media.user
    const collection = user.collection
    const rootCollection = collection.rootCollection

    if (media?.deletedAt) {
        return {
            isEffectivelyDeleted: true,
            deletionSource: "Marked deleted directly",
            deletedAt: media.deletedAt.toISOString()
        }
    }

    if (user?.deletedAt) {
        return {
            isEffectivelyDeleted: true,
            deletionSource: `Inherited from User '@${user.path.split(sep).pop()}' (Marked deleted)`,
            deletedAt: user.deletedAt.toISOString()
        }
    }

    if (collection?.deletedAt) {
        return {
            isEffectivelyDeleted: true,
            deletionSource: `Inherited from Collection '${collection.path.split(sep).pop()}' (Marked deleted)`,
            deletedAt: collection.deletedAt.toISOString()
        }
    }

    if (rootCollection?.deletedAt) {
        return {
            isEffectivelyDeleted: true,
            deletionSource: `Inherited from Root Collection '${rootCollection.path.split(sep).pop()}' (Marked deleted)`,
            deletedAt: rootCollection.deletedAt.toISOString()
        }
    }

    return { isEffectivelyDeleted: false, deletedAt: null }
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
