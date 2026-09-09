import { sep } from "node:path"
import { EffectiveMedia } from "./EffectiveMedia"

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
