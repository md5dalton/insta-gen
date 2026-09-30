import {
    EffectiveAccessResult,
    ProfileUser,
} from "@/types/types"
import { sep } from "node:path"
import { EffectiveMedia } from "./EffectiveMedia"
import { VisibilityType } from "@/prisma/generated/enums"


export function resolveEffectiveAccess(media: EffectiveMedia, profileUsers: ProfileUser[]): EffectiveAccessResult {
    
    const user = media.user
    const collection = user.collection
    const rootCollection = collection.rootCollection

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

    const effectivePolicy = [...chain].reverse().find((item) => item.vis !== VisibilityType.INHERIT) ?? chain[0]
    const effectiveVisibility = effectivePolicy.vis as EffectiveAccessResult["visibility"]

    const inheritedFrom: EffectiveAccessResult["inheritedFrom"] =
        effectivePolicy.level === "MEDIA"
            ? undefined
            : {
                level: effectivePolicy.level,
                name: `${effectivePolicy.level.replace("_", " ")} → ${effectivePolicy.name}`,
        }

    const effectiveAllowedSet = effectiveVisibility === VisibilityType.RESTRICTED
        ? new Set(effectivePolicy.allowed)
        : null

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
                blockedByParent: effectivePolicy.level !== "MEDIA",
                parentBlockReason: `${effectivePolicy.level.replace("_", " ")} '${effectivePolicy.name}' is private (Admin only).`,
            }
        }

        if (effectiveVisibility === "ALL_USERS") {
            return {
                user: pUser,
                allowed: true,
            }
        }

        const isAllowed = effectiveAllowedSet?.has(pUser.id) ?? true
        const blockedByParent = effectivePolicy.level !== "MEDIA"
        const parentBlockReason = isAllowed
            ? undefined
            : `${effectivePolicy.level.replace("_", " ")} '${effectivePolicy.name}' does not permit access for ${pUser.name}.`

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
