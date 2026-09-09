import {
    EffectivePolicyResult,
    ProcessingProfile,
} from "@/types/types"
import { AssetStatus, AssetType, MediaType } from "@/prisma/generated/enums"
import { sep } from "node:path"
import { processingProfile as processingProfileDefault } from "@/constants/models"
import { MediaAsset } from "@/prisma/generated/client"
import { Effective, EffectiveMedia } from "./EffectiveMedia"

interface EffectiveProcessingItem extends Effective {
    processingProfile: ProcessingProfile | null,
}

interface EffectiveProcessingRootCollection extends EffectiveProcessingItem {}
interface EffectiveProcessingCollection extends EffectiveProcessingItem {
    rootCollection: EffectiveProcessingRootCollection
}
interface EffectiveProcessingUser extends EffectiveProcessingItem {
    collection: EffectiveProcessingCollection
}
export interface EffectiveProcessingMedia extends EffectiveProcessingItem {
    user: EffectiveProcessingUser
    type: MediaType,
    assets: MediaAsset[],
}

export function resolveEffectiveProcessingPolicy(media: EffectiveProcessingMedia | EffectiveMedia): EffectivePolicyResult {

    const user = media.user
    const collection = user.collection
    const rootCollection = collection.rootCollection

    let chosenProfile: ProcessingProfile = processingProfileDefault
     
    let inheritedFrom: EffectivePolicyResult["inheritedFrom"] = {
        level: "SYSTEM_DEFAULT",
        name: "System Default (" + (media.type === MediaType.VIDEO ? "Video" : "Image") + ")",
    }

    // 1. Check Media level
    if (media.processingProfile) {
        chosenProfile = media.processingProfile
        inheritedFrom = {
            level: "MEDIA",
            name: `Direct Media Override (${media.path.split(sep).pop()})`,
            id: media.id,
        }
    }
    // 2. Check User level
    else if (user.processingProfile) {
        chosenProfile = user.processingProfile
        inheritedFrom = {
            level: "USER",
            name: `User → @${user.path.split(sep).pop()}`,
            id: user.id,
        }
    }
    // 3. Check Collection level
    else if (collection.processingProfile) {
        chosenProfile = collection.processingProfile
        inheritedFrom = {
            level: "COLLECTION",
            name: `Collection → ${collection.path.split(sep).pop()}`,
            id: collection.id,
        }
    }
    // 4. Check Root Collection level
    else if (rootCollection.processingProfile) {
        chosenProfile = rootCollection.processingProfile
        inheritedFrom = {
            level: "ROOT_COLLECTION",
            name: `Root Collection → ${rootCollection.path.split(sep).pop()}`,
            id: rootCollection.id,
        }
    }

    // Calculate existing assets that are READY
    const existingAssets: AssetType[] = media.assets
        .filter((a) => a.status === AssetStatus.READY)
        .map((a) => a.type)

    // Missing assets = required - existing
    const missingAssets = chosenProfile.renditions.filter((rendition) => !existingAssets.includes(rendition))

    const needsProcessing = missingAssets.length > 0

    return {
        profile: chosenProfile,
        inheritedFrom,
        requiredAssets: chosenProfile.renditions,
        existingAssets,
        missingAssets,
        needsProcessing,
    }
}
