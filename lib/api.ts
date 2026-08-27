import {
    AdminUser,
    LibraryStats,
    SystemSettings,
    ProcessingProfile,
    RootCollection,
    Collection,
    MediaUser,
    MediaItem,
    MediaFilterParams,
    PaginatedResponse,
    ProfileUser,
} from "@/types/types"

const TOKEN_KEY = "media_mgmt_token"

export function getAuthToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token)
}

export function clearAuthToken() {
    localStorage.removeItem(TOKEN_KEY)
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getAuthToken()
    const headers = new Headers(options.headers || {})

    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json")
    }

    if (token) {
        headers.set("Authorization", `Bearer ${token}`)
    }

    const response = await fetch(endpoint, {
        ...options,
        headers,
    })

    const data = await response.json()

    if (!response.ok) {
        const error = new Error(data.error || "API Request failed")
        ;(error as any).status = response.status
        ;(error as any).data = data
        throw error
    }

    return data as T
}

export const api = {
    // Auth
    async getAuthStatus(): Promise<{
        isConfigured: boolean
        isAuthenticated: boolean
        user: AdminUser | null
    }> {
        return fetchApi("/api/admin/auth/status")
    },

    async setupAdmin(data: {
        name: string
        email: string
        password: string
        confirmPassword: string
    }): Promise<{ success: boolean; token: string; user: AdminUser }> {
        return fetchApi("/api/admin/auth/setup", {
            method: "POST",
            body: JSON.stringify(data),
        })
    },

    async login(data: {
        email: string
        password: string
    }): Promise<{ success: boolean; token: string; user: AdminUser }> {
        return fetchApi("/api/admin/auth/login", {
            method: "POST",
            body: JSON.stringify(data),
        })
    },

    async logout(): Promise<void> {
        try {
            await fetchApi("/api/admin/auth/logout", { method: "POST" })
        } finally {
            clearAuthToken()
        }
    },

    // Stats & Settings
    async getStats(): Promise<LibraryStats> {
        return fetchApi("/api/admin/stats")
    },

    async getSettings(): Promise<SystemSettings> {
        return fetchApi("/api/admin/settings")
    },

    async updateMediaRoot(
        mediaRoot: string
    ): Promise<{ success: boolean; settings: SystemSettings; message: string }> {
        return fetchApi("/api/admin/settings/media-root", {
            method: "POST",
            body: JSON.stringify({ mediaRoot }),
        })
    },

    // Processing Profiles
    async getProfiles(): Promise<ProcessingProfile[]> {
        return fetchApi("/api/admin/profiles")
    },

    async createProfile(data: Partial<ProcessingProfile>): Promise<ProcessingProfile> {
        return fetchApi("/api/admin/profiles", {
            method: "POST",
            body: JSON.stringify(data),
        })
    },

    async updateProfile(id: string, data: Partial<ProcessingProfile>): Promise<ProcessingProfile> {
        return fetchApi(`/api/admin/profiles/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        })
    },

    async deleteProfile(id: string): Promise<{ success: boolean }> {
        return fetchApi(`/api/admin/profiles/${id}`, {
            method: "DELETE",
        })
    },

    // Hierarchy
    async getHierarchy(): Promise<RootCollection[]> {
        return fetchApi("/api/admin/hierarchy")
    },

    async createRootCollection(data: {
        name: string
        path?: string
        processingProfileId?: string | null
        visibility?: "ALL_USERS" | "RESTRICTED" | "PRIVATE"
        allowedUserIds?: string[]
    }): Promise<RootCollection> {
        return fetchApi("/api/admin/hierarchy/roots", {
            method: "POST",
            body: JSON.stringify(data),
        })
    },

    async createCollection(data: {
        rootCollectionId: string
        name: string
        path?: string
        processingProfileId?: string | null
        visibility?: string | null
        allowedUserIds?: string[]
    }): Promise<Collection> {
        return fetchApi("/api/admin/hierarchy/collections", {
            method: "POST",
            body: JSON.stringify(data),
        })
    },

    async createMediaUser(data: {
        collectionId: string
        username: string
        displayName?: string
        processingProfileId?: string | null
        visibility?: string | null
        allowedUserIds?: string[]
    }): Promise<MediaUser> {
        return fetchApi("/api/admin/hierarchy/media-users", {
            method: "POST",
            body: JSON.stringify(data),
        })
    },

    async updateHierarchyEntity(
        type: "root" | "collection" | "user",
        id: string,
        data: {
            processingProfileId?: string | null
            visibility?: string | null
            allowedUserIds?: string[]
            action?: "delete" | "restore"
        }
    ): Promise<{ success: boolean; entity: any }> {
        return fetchApi(`/api/admin/hierarchy/${type}/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        })
    },

    // Media
    async getMediaList(params: MediaFilterParams = {}): Promise<PaginatedResponse<MediaItem>> {
        const query = new URLSearchParams()
        Object.entries(params).forEach(([key, val]) => {
            if (val !== undefined && val !== null && val !== "") {
                query.append(key, String(val))
            }
        })
        return fetchApi(`/api/admin/media?${query.toString()}`)
    },

    async getMedia(id: string): Promise<MediaItem> {
        return fetchApi(`/api/admin/media/${id}`)
    },

    async createMedia(data: {
        name: string
        type?: "IMAGE" | "VIDEO"
        userId: string
        collectionId: string
        rootCollectionId: string
        size?: number
        width?: number
        height?: number
        duration?: number
        bitrate?: number
        tags?: string[]
        previewUrl?: string
        thumbnailUrl?: string
        processingProfileId?: string | null
        visibility?: string | null
        allowedUserIds?: string[]
    }): Promise<MediaItem> {
        return fetchApi("/api/admin/media", {
            method: "POST",
            body: JSON.stringify(data),
        })
    },

    async getMediaAssets(mediaId: string): Promise<any[]> {
        return fetchApi(`/api/admin/media/${mediaId}/assets`)
    },

    async addMediaAsset(
        mediaId: string,
        data: {
            type: "THUMBNAIL" | "FEED_IMAGE" | "HLS" | "LOW_QUALITY"
            status?: "READY" | "MISSING" | "PROCESSING" | "FAILED"
            path?: string
            size?: number
            error?: string
        }
    ): Promise<{ success: boolean; asset: any; media: MediaItem }> {
        return fetchApi(`/api/admin/media/${mediaId}/assets`, {
            method: "POST",
            body: JSON.stringify(data),
        })
    },

    async deleteMediaAsset(
        mediaId: string,
        assetId: string
    ): Promise<{ success: boolean; deleted: any; media: MediaItem }> {
        return fetchApi(`/api/admin/media/${mediaId}/assets/${assetId}`, {
            method: "DELETE",
        })
    },

    async updateMediaPolicy(id: string, processingProfileId: string | null): Promise<MediaItem> {
        return fetchApi(`/api/admin/media/${id}/policy`, {
            method: "POST",
            body: JSON.stringify({ processingProfileId }),
        })
    },

    async updateMediaAccess(
        id: string,
        data: { visibility?: string | null; allowedUserIds?: string[] }
    ): Promise<MediaItem> {
        return fetchApi(`/api/admin/media/${id}/access`, {
            method: "POST",
            body: JSON.stringify(data),
        })
    },

    async processMedia(id: string): Promise<{ success: boolean; media: MediaItem }> {
        return fetchApi(`/api/admin/media/${id}/process`, {
            method: "POST",
        })
    },

    async retryMedia(id: string): Promise<{ success: boolean; media: MediaItem }> {
        return fetchApi(`/api/admin/media/${id}/retry`, {
            method: "POST",
        })
    },

    async deleteMedia(id: string): Promise<{ success: boolean; media: MediaItem }> {
        return fetchApi(`/api/admin/media/${id}/delete`, {
            method: "POST",
        })
    },

    async restoreMedia(id: string): Promise<{ success: boolean; media: MediaItem }> {
        return fetchApi(`/api/admin/media/${id}/restore`, {
            method: "POST",
        })
    },

    async bulkMediaAction(data: {
        action:
            | "PROCESS"
            | "ASSIGN_PROFILE"
            | "SET_VISIBILITY"
            | "ADD_TAG"
            | "REMOVE_TAG"
            | "MARK_DELETED"
            | "RESTORE"
        mediaIds: string[]
        processingProfileId?: string | null
        visibility?: string | null
        allowedUserIds?: string[]
        tag?: string
    }): Promise<{
        success: boolean
        affectedCount: number
        skippedCount: number
        message: string
    }> {
        return fetchApi("/api/admin/media/bulk", {
            method: "POST",
            body: JSON.stringify(data),
        })
    },

    // Users & Access
    async getUsers(): Promise<ProfileUser[]> {
        return fetchApi("/api/admin/users")
    },

    async createUser(data: {
        name: string
        email: string
        role?: "ADMIN" | "USER"
        capability: string
    }): Promise<ProfileUser> {
        return fetchApi("/api/admin/users", {
            method: "POST",
            body: JSON.stringify(data),
        })
    },

    async updateUser(id: string, data: Partial<ProfileUser>): Promise<ProfileUser> {
        return fetchApi(`/api/admin/users/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        })
    },

    async getUser(id: string): Promise<ProfileUser> {
        return fetchApi(`/api/admin/users/${id}`)
    },

    async deleteUser(id: string): Promise<{ success: boolean; deleted: ProfileUser }> {
        return fetchApi(`/api/admin/users/${id}`, {
            method: "DELETE",
        })
    },

    // Tags
    async getTags(): Promise<{ name: string; count: number }[]> {
        return fetchApi("/api/admin/tags")
    },

    // Schema & Data Model
    async getSchema(): Promise<any> {
        return fetchApi("/api/admin/schema")
    },
}
