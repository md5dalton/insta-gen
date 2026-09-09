import {
    EffectiveAccessResult,
    ProfileUser,
} from "@/types/types"
import { sep } from "node:path"
import { EffectiveMedia } from "./EffectiveMedia"


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
