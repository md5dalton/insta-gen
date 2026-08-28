export type ProcessingStatus = "NEW" | "NEEDS_PROCESSING" | "PROCESSING" | "READY" | "FAILED"

export type AssetType = "THUMBNAIL" | "FEED_IMAGE" | "HLS" | "LOW_QUALITY"

export type AssetStatus = "READY" | "MISSING" | "PROCESSING" | "FAILED"

export type VisibilityType = "INHERIT" | "ALL_USERS" | "RESTRICTED" | "PRIVATE"

export type UserCapability = "VIEW" | "DOWNLOAD" | "MANAGE" | "ADMIN"

export enum MediaType {
    IMAGE = "IMAGE",
    VIDEO = "VIDEO",
}

export type MediaTypeString = "IMAGE" | "VIDEO"

export interface AdminUser {
    id: string
    name: string
    email: string
    passwordHash?: string
    createdAt: string
}

export interface ProcessingProfile {
    id: string
    name: string
    description: string
    isSystem?: boolean
    requiredRenditions: {
        thumbnail: true // Always mandatory
        feedImage: boolean
        hls: boolean
        lowQuality: boolean
    }
}

export interface MediaAsset {
    id: string
    mediaId: string
    type: AssetType
    status: AssetStatus
    path?: string
    size?: number
    width?: number
    height?: number
    error?: string
    generatedAt?: string
}

export interface ProfileUser {
    id: string
    name: string
    email: string
    role: "ADMIN" | "USER"
    capability: UserCapability // VIEW automatically includes view+like+save DOWNLOAD adds original download
    createdAt: string
    avatarUrl?: string
}

export interface RootCollection {
    id: string
    name: string
    path: string
    processingProfileId?: string | null
    visibility?: "ALL_USERS" | "RESTRICTED" | "PRIVATE" | null
    allowedUserIds?: string[]
    deletedAt?: string | null
    collectionsCount?: number
    mediaCount?: number
    collections?: Collection[]
}

export interface Collection {
    id: string
    rootCollectionId: string
    rootCollectionName?: string
    name: string
    path: string
    processingProfileId?: string | null
    visibility?: VisibilityType | null
    allowedUserIds?: string[]
    deletedAt?: string | null
    usersCount?: number
    mediaCount?: number
    users?: MediaUser[]
}

export interface MediaUser {
    id: string
    collectionId: string
    collectionName?: string
    rootCollectionId?: string
    rootCollectionName?: string
    username: string
    displayName: string
    avatarUrl?: string
    processingProfileId?: string | null
    visibility?: VisibilityType | null
    allowedUserIds?: string[]
    deletedAt?: string | null
    mediaCount?: number
}

export interface EffectivePolicyResult {
    profile: ProcessingProfile
    inheritedFrom: {
        level: "MEDIA" | "USER" | "COLLECTION" | "ROOT_COLLECTION" | "SYSTEM_DEFAULT"
        name: string
        id?: string
    }
    requiredAssets: AssetType[]
    existingAssets: AssetType[]
    missingAssets: AssetType[]
    needsProcessing: boolean
}

export interface EffectiveAccessResult {
    visibility: "ALL_USERS" | "RESTRICTED" | "PRIVATE"
    inheritedFrom?: {
        level: "MEDIA" | "USER" | "COLLECTION" | "ROOT_COLLECTION"
        name: string
    }
    effectiveUsers: {
        user: ProfileUser
        allowed: boolean
        blockedByParent?: boolean
        parentBlockReason?: string
    }[]
}

export interface MediaItem {
    id: string
    name: string
    type: MediaType
    path: string
    size: number
    width?: number
    height?: number
    duration?: number // In seconds for video
    bitrate?: number // kbps
    mktime?: string
    createdAt: string
    updatedAt: string
    deletedAt?: string | null

    // Hierarchy relations
    userId: string
    userName?: string
    collectionId: string
    collectionName?: string
    rootCollectionId: string
    rootCollectionName?: string

    // Overrides
    processingProfileId?: string | null
    visibility?: VisibilityType | null
    allowedUserIds?: string[]
    tags: string[]

    // Social counts preserved
    likesCount: number
    savesCount: number

    // Calculated and runtime states
    thumbnailUrl: string
    previewUrl: string
    assets: MediaAsset[]
    processingStatus: ProcessingStatus
    processingError?: {
        stage: string
        message: string
        timestamp: string
    } | null

    // Resolved dynamic values from backend
    effectivePolicy?: EffectivePolicyResult
    effectiveAccess?: EffectiveAccessResult
    isEffectivelyDeleted?: boolean
    effectiveDeletionSource?: string
}

export interface MediaFilterParams {
    query?: string
    type?: "ALL" | "IMAGE" | "VIDEO"
    status?: "ALL" | ProcessingStatus | "DELETED"
    rootCollectionId?: string
    collectionId?: string
    userId?: string
    profileId?: string
    tag?: string
    visibility?: string
    includeDeleted?: string
    deletionStatus?: "ACTIVE" | "DELETED" | "ALL"
    sortBy?: "createdAt" | "name" | "size" | "status" | "likes"
    sortOrder?: "asc" | "desc"
    page?: string | number
    limit?: string | number
}

export interface PaginatedResponse<T> {
    items: T[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface LibraryStats {
    totalFiles?: number
    readyFiles?: number
    processingFiles?: number
    errorFiles?: number
    totalStorageBytes?: number
    totalRootCollections?: number
    totalCollections?: number
    totalMediaUsers?: number
    totalMedia?: number
    imageCount?: number
    videoCount?: number
    newMediaCount?: number
    needsProcessingCount?: number
    processingFailuresCount?: number
    markedDeletedCount?: number
    readyCount?: number
    processingCount?: number
    renditions?: {
        total: number
        ready: number
        missing: number
        failed: number
    }
    recentActivity?: {
        id: string
        type: "DISCOVERY" | "PROCESSED" | "FAILED" | "POLICY_CHANGE" | "DELETED" | "SETTINGS_UPDATE"
        title: string
        description: string
        timestamp: string
    }[]
}

export interface SystemSettings {
    mediaRoot: string
    mediaRootStatus: {
        exists: boolean
        readable: boolean
        writable: boolean
        path: string
    }
    databaseStatus: {
        connected: boolean
        latencyMs: number
    }
    mediaProcessorStatus: {
        running: boolean
        activeWorkers: number
        queuedJobs: number
    }
}
