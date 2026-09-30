import {
    ProcessingProfile,
} from "@/types/types"
import { MediaType, UserRole, VisibilityType } from "@/prisma/generated/enums"
import { MediaAsset } from "@/prisma/generated/client"


export interface Effective {
    id: string,
    path: string,
}

interface AllowedUser {
    id: string
    name: string
    role: UserRole
}
interface EffectiveItem {
    id: string,
    path: string,
    processingProfile: ProcessingProfile | null,
    visibility: VisibilityType
    deletedAt: Date | null
    allowedUsers: AllowedUser[]
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