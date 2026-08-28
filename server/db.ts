import {
    AdminUser,
    ProcessingProfile,
    RootCollection,
    Collection,
    MediaUser,
    MediaItem,
    ProfileUser,
    MediaAsset,
    SystemSettings,
    MediaType,
} from "@/types/types"
import prisma from "@/lib/prisma"

export class DatabaseStore {
    admin: AdminUser | null = null
    adminPasswordHash: string | null = null
    tokens: Set<string> = new Set()

    settings: SystemSettings = {
        mediaRoot: "/mnt/media/library",
        mediaRootStatus: {
            exists: true,
            readable: true,
            writable: true,
            path: "/mnt/media/library",
        },
        databaseStatus: {
            connected: true,
            latencyMs: 4,
        },
        mediaProcessorStatus: {
            running: true,
            activeWorkers: 3,
            queuedJobs: 0,
        },
    }

    profiles: ProcessingProfile[] = [
        {
            id: "profile-direct",
            name: "Direct",
            description:
                "Standard storage with required thumbnail. No additional transcode renditions.",
            isSystem: true,
            requiredRenditions: {
                thumbnail: true,
                feedImage: false,
                hls: false,
                lowQuality: false,
            },
        },
        {
            id: "profile-image-feed",
            name: "Image Feed",
            description:
                "Optimized for social image feeds. Generates thumbnail + web-optimized feed image.",
            isSystem: true,
            requiredRenditions: {
                thumbnail: true,
                feedImage: true,
                hls: false,
                lowQuality: false,
            },
        },
        {
            id: "profile-video-feed",
            name: "Video Feed",
            description:
                "Optimized for video streaming and reels. Generates thumbnail + adaptive HLS streams.",
            isSystem: true,
            requiredRenditions: {
                thumbnail: true,
                feedImage: false,
                hls: true,
                lowQuality: false,
            },
        },
        {
            id: "profile-video-hq-lq",
            name: "Video Feed + Low Quality",
            description:
                "Comprehensive video profile with thumbnail + HLS + 720p/480p low-quality fallback.",
            isSystem: true,
            requiredRenditions: {
                thumbnail: true,
                feedImage: false,
                hls: true,
                lowQuality: true,
            },
        },
    ]

    profileUsers: ProfileUser[] = [
        {
            id: "puser-1",
            name: "Sarah Jenkins",
            email: "sarah.j@example.com",
            role: "USER",
            capability: "VIEW",
            createdAt: "2026-01-15T10:00:00.000Z",
        },
        {
            id: "puser-2",
            name: "Mark Stevens",
            email: "mark.stevens@example.com",
            role: "USER",
            capability: "DOWNLOAD",
            createdAt: "2026-02-01T14:30:00.000Z",
        },
        {
            id: "puser-3",
            name: "Elena Vance",
            email: "elena.v@example.com",
            role: "USER",
            capability: "MANAGE",
            createdAt: "2026-03-10T09:15:00.000Z",
        },
        {
            id: "puser-4",
            name: "David Kim",
            email: "david.k@example.com",
            role: "USER",
            capability: "VIEW",
            createdAt: "2026-04-12T11:45:00.000Z",
        },
    ]

    rootCollections: RootCollection[] = [
        {
            id: "root-1",
            name: "Social Media Ingest",
            path: "social-media-ingest",
            processingProfileId: "profile-image-feed",
            visibility: "ALL_USERS",
            allowedUserIds: ["puser-1", "puser-2", "puser-3", "puser-4"],
            deletedAt: null,
        },
        {
            id: "root-2",
            name: "Personal Archive",
            path: "personal-archive",
            processingProfileId: "profile-direct",
            visibility: "RESTRICTED",
            allowedUserIds: ["puser-1", "puser-2", "puser-3"],
            deletedAt: null,
        },
        {
            id: "root-3",
            name: "Raw Video Production",
            path: "video-production",
            processingProfileId: "profile-video-hq-lq",
            visibility: "PRIVATE",
            allowedUserIds: [],
            deletedAt: null,
        },
    ]

    collections: Collection[] = [
        {
            id: "col-1",
            rootCollectionId: "root-1",
            name: "Instagram Imports",
            path: "instagram-imports",
            processingProfileId: "profile-image-feed",
            visibility: "INHERIT",
            allowedUserIds: ["puser-1", "puser-2"],
            deletedAt: null,
        },
        {
            id: "col-2",
            rootCollectionId: "root-1",
            name: "TikTok Reels",
            path: "tiktok-reels",
            processingProfileId: "profile-video-feed",
            visibility: "RESTRICTED",
            allowedUserIds: ["puser-1", "puser-2", "puser-3"],
            deletedAt: null,
        },
        {
            id: "col-3",
            rootCollectionId: "root-2",
            name: "Family & Events 2026",
            path: "family-events-2026",
            processingProfileId: null, // inherits from root-2 ('profile-direct')
            visibility: "RESTRICTED",
            allowedUserIds: ["puser-1", "puser-2"],
            deletedAt: null,
        },
        {
            id: "col-4",
            rootCollectionId: "root-2",
            name: "Archived Projects",
            path: "archived-projects",
            processingProfileId: null,
            visibility: "PRIVATE",
            allowedUserIds: [],
            deletedAt: "2026-08-10T14:20:00.000Z", // Soft-deleted collection
        },
    ]

    mediaUsers: MediaUser[] = [
        {
            id: "user-1",
            collectionId: "col-1",
            username: "alex_travels",
            displayName: "Alex Rivers",
            processingProfileId: null,
            visibility: "INHERIT",
            allowedUserIds: [],
            deletedAt: null,
        },
        {
            id: "user-2",
            collectionId: "col-1",
            username: "sophia_art",
            displayName: "Sophia Chen",
            processingProfileId: null,
            visibility: "INHERIT",
            allowedUserIds: [],
            deletedAt: null,
        },
        {
            id: "user-3",
            collectionId: "col-2",
            username: "jordan_reels",
            displayName: "Jordan Miller",
            processingProfileId: "profile-video-hq-lq", // override
            visibility: "INHERIT",
            allowedUserIds: [],
            deletedAt: null,
        },
        {
            id: "user-4",
            collectionId: "col-3",
            username: "family_vault",
            displayName: "Family Vault Owner",
            processingProfileId: null,
            visibility: "INHERIT",
            allowedUserIds: [],
            deletedAt: null,
        },
        {
            id: "user-5",
            collectionId: "col-4",
            username: "old_legacy_user",
            displayName: "Legacy User",
            processingProfileId: null,
            visibility: "INHERIT",
            allowedUserIds: [],
            deletedAt: null,
        },
    ]

    media: MediaItem[] = []
    recentActivity: {
        id: string
        type: "DISCOVERY" | "PROCESSED" | "FAILED" | "POLICY_CHANGE" | "DELETED"
        title: string
        description: string
        timestamp: string
    }[] = []

    constructor() {
        this.seedInitialMedia()
        this.seedInitialActivity()
    }

    // ---------- Prisma-backed admin & sessions API wrappers ----------

    async adminCount(): Promise<number> {
        try {
            return await prisma.adminUser.count()
        } catch (e) {
            return this.admin ? 1 : 0
        }
    }

    async findAdminByEmail(email: string) {
        try {
            const rec = await prisma.adminUser.findUnique({ where: { email } })
            if (!rec) return null
            return {
                id: rec.id,
                name: rec.name,
                email: rec.email,
                passwordHash: rec.passwordHash,
                createdAt: rec.createdAt.toISOString(),
            }
        } catch (e) {
            // fallback to in-memory
            if (this.admin && this.admin.email.toLowerCase() === email.toLowerCase()) return this.admin
            return null
        }
    }

    async createAdmin(data: { name: string; email: string; passwordHash: string }) {
        const created = await prisma.adminUser.create({ data: { name: data.name, email: data.email, passwordHash: data.passwordHash } })
        // mirror into memory
        this.admin = {
            id: created.id,
            name: created.name,
            email: created.email,
            createdAt: created.createdAt.toISOString(),
        }
        this.adminPasswordHash = created.passwordHash
        return this.admin
    }

    async createSession(token: string, adminId: string) {
        await prisma.adminSession.create({ data: { token, adminUserId: adminId } })
    }

    async deleteSession(token: string) {
        await prisma.adminSession.deleteMany({ where: { token } })
    }

    async loadFromDatabase(): Promise<void> {
        const admin = await prisma.adminUser.findFirst()
        if (admin) {
            this.admin = {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                createdAt: admin.createdAt.toISOString(),
            }
            this.adminPasswordHash = admin.passwordHash
        }
    }

    // ---------- Read helpers to begin migration from in-memory store ----------

    async findMediaById(id: string) {
        try {
            const rec: any = await prisma.mediaItem.findUnique({ where: { id }, include: { assets: true } })
            if (!rec) return null
            const allowed = await prisma.mediaItemAllowedUser.findMany({ where: { mediaItemId: id } })
            return {
                ...rec,
                createdAt: rec.createdAt?.toISOString(),
                updatedAt: rec.updatedAt?.toISOString(),
                deletedAt: rec.deletedAt ? rec.deletedAt.toISOString() : null,
                assets: (rec.assets || []).map((a: any) => ({ ...a, generatedAt: a.generatedAt ? a.generatedAt.toISOString() : undefined })),
                allowedUserIds: allowed.map((a: any) => a.profileUserId),
            }
        } catch (e) {
            return this.media.find((m) => m.id === id) || null
        }
    }

    async findCollectionById(id: string) {
        try {
            const rec: any = await prisma.collection.findUnique({ where: { id } })
            if (!rec) return null
            const allowed = await prisma.collectionAllowedUser.findMany({ where: { collectionId: id } })
            return { ...rec, deletedAt: rec.deletedAt ? rec.deletedAt.toISOString() : null, allowedUserIds: allowed.map((a: any) => a.profileUserId) }
        } catch (e) {
            return this.collections.find((c) => c.id === id) || null
        }
    }

    async findRootCollectionById(id: string) {
        try {
            const rec: any = await prisma.rootCollection.findUnique({ where: { id } })
            if (!rec) return null
            const allowed = await prisma.rootCollectionAllowedUser.findMany({ where: { rootCollectionId: id } })
            return { ...rec, deletedAt: rec.deletedAt ? rec.deletedAt.toISOString() : null, allowedUserIds: allowed.map((a: any) => a.profileUserId) }
        } catch (e) {
            return this.rootCollections.find((r) => r.id === id) || null
        }
    }

    async findMediaUserById(id: string) {
        try {
            const rec: any = await prisma.mediaUser.findUnique({ where: { id } })
            if (!rec) return null
            const allowed = await prisma.mediaUserAllowedUser.findMany({ where: { mediaUserId: id } })
            return { ...rec, deletedAt: rec.deletedAt ? rec.deletedAt.toISOString() : null, allowedUserIds: allowed.map((a: any) => a.profileUserId) }
        } catch (e) {
            return this.mediaUsers.find((u) => u.id === id) || null
        }
    }

    async findProfileUserById(id: string) {
        try {
            const rec: any = await prisma.profileUser.findUnique({ where: { id } })
            if (!rec) return null
            return { ...rec, createdAt: rec.createdAt.toISOString() }
        } catch (e) {
            return this.profileUsers.find((p) => p.id === id) || null
        }
    }

    async listProfileUsers() {
        try {
            const recs: any[] = await prisma.profileUser.findMany()
            return recs.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))
        } catch (e) {
            return this.profileUsers
        }
    }

    async listMedia() {
        try {
            const recs: any[] = await prisma.mediaItem.findMany({ include: { assets: true } })
            const results = []
            for (const r of recs) {
                const allowed = await prisma.mediaItemAllowedUser.findMany({ where: { mediaItemId: r.id } })
                results.push({
                    ...r,
                    createdAt: r.createdAt?.toISOString(),
                    updatedAt: r.updatedAt?.toISOString(),
                    deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null,
                    assets: (r.assets || []).map((a: any) => ({ ...a, generatedAt: a.generatedAt ? a.generatedAt.toISOString() : undefined })),
                    allowedUserIds: allowed.map((a: any) => a.profileUserId),
                })
            }
            return results
        } catch (e) {
            return this.media
        }
    }

    async listCollections() {
        try {
            const recs: any[] = await prisma.collection.findMany()
            const results = []
            for (const r of recs) {
                const allowed = await prisma.collectionAllowedUser.findMany({ where: { collectionId: r.id } })
                results.push({ ...r, deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null, allowedUserIds: allowed.map((a: any) => a.profileUserId) })
            }
            return results
        } catch (e) {
            return this.collections
        }
    }

    async listRootCollections() {
        try {
            const recs: any[] = await prisma.rootCollection.findMany()
            const results = []
            for (const r of recs) {
                const allowed = await prisma.rootCollectionAllowedUser.findMany({ where: { rootCollectionId: r.id } })
                results.push({ ...r, deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null, allowedUserIds: allowed.map((a: any) => a.profileUserId) })
            }
            return results
        } catch (e) {
            return this.rootCollections
        }
    }

    async listMediaUsers() {
        try {
            const recs: any[] = await prisma.mediaUser.findMany()
            const results = []
            for (const r of recs) {
                const allowed = await prisma.mediaUserAllowedUser.findMany({ where: { mediaUserId: r.id } })
                results.push({ ...r, deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null, allowedUserIds: allowed.map((a: any) => a.profileUserId) })
            }
            return results
        } catch (e) {
            return this.mediaUsers
        }
    }

    async listRecentActivity() {
        try {
            const recs: any[] = await prisma.activityLog.findMany({ orderBy: { timestamp: "desc" }, take: 50 })
            return recs.map((r) => ({ ...r, timestamp: r.timestamp.toISOString() }))
        } catch (e) {
            return this.recentActivity
        }
    }

    // ---------- Prisma-backed media write helpers ----------

    async createMedia(payload: Partial<MediaItem> & { assets?: Partial<MediaAsset>[]; allowedUserIds?: string[] }) {
        const created = await prisma.mediaItem.create({
            data: ({
                name: payload.name || "",
                type: (payload.type as any) || "IMAGE",
                path: payload.path || "",
                size: payload.size ? BigInt(payload.size as any) : BigInt(0),
                width: (payload.width as any) || 0,
                height: (payload.height as any) || 0,
                duration: (payload.duration as any) || undefined,
                bitrate: (payload.bitrate as any) || undefined,
                previewUrl: payload.previewUrl || "",
                thumbnailUrl: payload.thumbnailUrl || null,
                tags: (payload.tags as any) || [],
                likesCount: payload.likesCount || 0,
                savesCount: payload.savesCount || 0,
                processingStatus: (payload.processingStatus as any) || undefined,
                processingError: payload.processingError ? JSON.stringify(payload.processingError) : undefined,
                visibility: (payload.visibility as any) || undefined,
                user: payload.userId ? { connect: { id: payload.userId } } : undefined,
                collection: payload.collectionId ? { connect: { id: payload.collectionId } } : undefined,
                rootCollection: payload.rootCollectionId ? { connect: { id: payload.rootCollectionId } } : undefined,
                processingProfile: payload.processingProfileId ? { connect: { id: payload.processingProfileId } } : undefined,
                assets: payload.assets && payload.assets.length ? { create: payload.assets.map((a) => ({ type: (a.type as any), status: (a.status as any), path: (a.path as any) || undefined, size: a.size ? BigInt(a.size as any) : undefined, width: (a.width as any) || undefined, height: (a.height as any) || undefined, error: (a as any).error || undefined, generatedAt: a.generatedAt ? new Date(a.generatedAt as any) : undefined })) } : undefined,
            } as any),
            include: { assets: true },
        })

        if (payload.allowedUserIds && payload.allowedUserIds.length) {
            const rows = payload.allowedUserIds.map((uid) => ({ mediaItemId: created.id, userId: uid }))
            // createMany with skipDuplicates if available
            try {
                    await prisma.mediaItemAllowedUser.createMany({ data: rows })
            } catch (e) {
                // ignore duplicate errors
            }
        }

        return this.findMediaById(created.id)
    }

    async updateMedia(id: string, updates: Partial<MediaItem> & { assets?: Partial<MediaAsset>[]; allowedUserIds?: string[] }) {
        const data: any = {}
        if (updates.name !== undefined) data.name = updates.name
        if (updates.path !== undefined) data.path = updates.path
        if (updates.size !== undefined) data.size = BigInt(updates.size as any)
        if (updates.width !== undefined) data.width = updates.width
        if (updates.height !== undefined) data.height = updates.height
        if (updates.duration !== undefined) data.duration = updates.duration
        if (updates.bitrate !== undefined) data.bitrate = updates.bitrate
        if (updates.previewUrl !== undefined) data.previewUrl = updates.previewUrl
        if (updates.thumbnailUrl !== undefined) data.thumbnailUrl = updates.thumbnailUrl
        if (updates.tags !== undefined) data.tags = updates.tags
        if (updates.likesCount !== undefined) data.likesCount = updates.likesCount
        if (updates.savesCount !== undefined) data.savesCount = updates.savesCount
        if (updates.processingStatus !== undefined) data.processingStatus = updates.processingStatus as any
        if (updates.processingError !== undefined) data.processingError = updates.processingError as any
        if (updates.visibility !== undefined) data.visibility = updates.visibility as any

        if (updates.assets && updates.assets.length) {
            // Upsert assets by unique constraint (mediaId + type). Simpler: delete existing assets for this media and recreate.
                await prisma.mediaAsset.deleteMany({ where: { mediaId: id } })
                await prisma.mediaAsset.createMany({ data: updates.assets.map((a) => ({ mediaId: id, type: (a.type as any), status: (a.status as any), path: (a.path as any) || undefined, size: a.size ? BigInt(a.size as any) : undefined, width: (a.width as any) || undefined, height: (a.height as any) || undefined, error: (a as any).error || undefined, generatedAt: a.generatedAt ? new Date(a.generatedAt as any) : undefined })) })
        }

            await prisma.mediaItem.update({ where: { id }, data: data as any })

        if (updates.allowedUserIds) {
            // replace allowed users
            await prisma.mediaItemAllowedUser.deleteMany({ where: { mediaItemId: id } })
            if (updates.allowedUserIds.length) {
                const rows = updates.allowedUserIds.map((uid) => ({ mediaItemId: id, userId: uid }))
                try {
                    await prisma.mediaItemAllowedUser.createMany({ data: rows })
                } catch (e) {}
            }
        }

        return this.findMediaById(id)
    }

    async softDeleteMedia(id: string) {
        const now = new Date()
        await prisma.mediaItem.update({ where: { id }, data: { deletedAt: now } })
        return this.findMediaById(id)
    }

    // ---------- Collections & Profiles write helpers ----------

    async createCollection(payload: Partial<Collection> & { allowedUserIds?: string[] }) {
        const created = await prisma.collection.create({ data: ({
            name: payload.name || "",
            path: payload.path || "",
            rootCollection: payload.rootCollectionId ? { connect: { id: payload.rootCollectionId } } : undefined,
            processingProfile: payload.processingProfileId ? { connect: { id: payload.processingProfileId } } : undefined,
            visibility: (payload.visibility as any) || undefined,
        } as any) })

        if (payload.allowedUserIds && payload.allowedUserIds.length) {
            const rows = payload.allowedUserIds.map((uid) => ({ collectionId: created.id, userId: uid }))
            try { await prisma.collectionAllowedUser.createMany({ data: rows }) } catch (e) {}
        }

        return this.findCollectionById(created.id)
    }

    async updateCollection(id: string, updates: Partial<Collection> & { allowedUserIds?: string[] }) {
        const data: any = {}
        if (updates.name !== undefined) data.name = updates.name
        if (updates.path !== undefined) data.path = updates.path
        if (updates.processingProfileId !== undefined) data.processingProfile = updates.processingProfileId ? { connect: { id: updates.processingProfileId } } : undefined
        if (updates.visibility !== undefined) data.visibility = updates.visibility as any
        await prisma.collection.update({ where: { id }, data: data as any })
        if (updates.allowedUserIds) {
            await prisma.collectionAllowedUser.deleteMany({ where: { collectionId: id } })
            if (updates.allowedUserIds.length) {
                const rows = updates.allowedUserIds.map((uid) => ({ collectionId: id, userId: uid }))
                try { await prisma.collectionAllowedUser.createMany({ data: rows }) } catch (e) {}
            }
        }
        return this.findCollectionById(id)
    }

    async createProfileUser(payload: Partial<ProfileUser>) {
        const created = await prisma.profileUser.create({ data: ({
            name: payload.name || "",
            email: payload.email || "",
            role: (payload.role as any) || undefined,
            capability: (payload.capability as any) || undefined,
            picture: (payload as any).picture || undefined,
        } as any) })
        return this.findProfileUserById(created.id)
    }

    async updateProfileUser(id: string, updates: Partial<ProfileUser>) {
        const data: any = {}
        if (updates.name !== undefined) data.name = updates.name
        if (updates.email !== undefined) data.email = updates.email
        if (updates.role !== undefined) data.role = updates.role as any
        if (updates.capability !== undefined) data.capability = updates.capability as any
        if ((updates as any).picture !== undefined) data.picture = (updates as any).picture
        await prisma.profileUser.update({ where: { id }, data: data as any })
        return this.findProfileUserById(id)
    }

    async deleteProfileUser(id: string) {
        const existing = await prisma.profileUser.findUnique({ where: { id } })
        if (!existing) return null
        if (existing.role === "ADMIN") {
            const adminCount = await prisma.profileUser.count({ where: { role: "ADMIN" } })
            if (adminCount <= 1) throw new Error("Cannot delete the primary administrator")
        }
        const deleted = await prisma.profileUser.delete({ where: { id } })
        return { ...deleted, createdAt: deleted.createdAt.toISOString() }
    }

    async createMediaUser(payload: Partial<MediaUser> & { allowedUserIds?: string[] }) {
        const created = await prisma.mediaUser.create({ data: ({
            username: payload.username || "",
            displayName: (payload as any).displayName || payload.username || "",
            collection: payload.collectionId ? { connect: { id: payload.collectionId } } : undefined,
            visibility: (payload.visibility as any) || undefined,
            processingProfile: payload.processingProfileId ? { connect: { id: payload.processingProfileId } } : undefined,
        } as any) })

        if (payload.allowedUserIds && payload.allowedUserIds.length) {
            const rows = payload.allowedUserIds.map((uid) => ({ mediaUserId: created.id, userId: uid }))
            try { await prisma.mediaUserAllowedUser.createMany({ data: rows }) } catch (e) {}
        }

        return this.findMediaUserById(created.id)
    }

    async updateMediaUser(id: string, updates: Partial<MediaUser> & { allowedUserIds?: string[] }) {
        const data: any = {}
        if (updates.username !== undefined) data.username = updates.username
        if ((updates as any).displayName !== undefined) data.displayName = (updates as any).displayName
        if (updates.processingProfileId !== undefined) data.processingProfile = updates.processingProfileId ? { connect: { id: updates.processingProfileId } } : undefined
        if (updates.visibility !== undefined) data.visibility = updates.visibility as any
        await prisma.mediaUser.update({ where: { id }, data: data as any })
        if (updates.allowedUserIds) {
            await prisma.mediaUserAllowedUser.deleteMany({ where: { mediaUserId: id } })
            if (updates.allowedUserIds.length) {
                const rows = updates.allowedUserIds.map((uid) => ({ mediaUserId: id, userId: uid }))
                try { await prisma.mediaUserAllowedUser.createMany({ data: rows }) } catch (e) {}
            }
        }
        return this.findMediaUserById(id)
    }

    async createRootCollection(payload: Partial<RootCollection> & { allowedUserIds?: string[] }) {
        const created = await prisma.rootCollection.create({ data: ({
            name: payload.name || "",
            path: payload.path || "",
            visibility: (payload.visibility as any) || undefined,
            processingProfile: payload.processingProfileId ? { connect: { id: payload.processingProfileId } } : undefined,
        } as any) })
        if (payload.allowedUserIds && payload.allowedUserIds.length) {
            const rows = payload.allowedUserIds.map((uid) => ({ rootCollectionId: created.id, userId: uid }))
            try { await prisma.rootCollectionAllowedUser.createMany({ data: rows }) } catch (e) {}
        }
        return this.findRootCollectionById(created.id)
    }

    async updateRootCollection(id: string, updates: Partial<RootCollection> & { allowedUserIds?: string[] }) {
        const data: any = {}
        if (updates.name !== undefined) data.name = updates.name
        if (updates.path !== undefined) data.path = updates.path
        if (updates.processingProfileId !== undefined) data.processingProfile = updates.processingProfileId ? { connect: { id: updates.processingProfileId } } : undefined
        if (updates.visibility !== undefined) data.visibility = updates.visibility as any
        await prisma.rootCollection.update({ where: { id }, data: data as any })
        if (updates.allowedUserIds) {
            await prisma.rootCollectionAllowedUser.deleteMany({ where: { rootCollectionId: id } })
            if (updates.allowedUserIds.length) {
                const rows = updates.allowedUserIds.map((uid) => ({ rootCollectionId: id, userId: uid }))
                try { await prisma.rootCollectionAllowedUser.createMany({ data: rows }) } catch (e) {}
            }
        }
        return this.findRootCollectionById(id)
    }

    async listProcessingProfiles() {
        try {
            const recs: any[] = await prisma.processingProfile.findMany()
            return recs.map((r) => ({
                id: r.id,
                name: r.name,
                description: r.description,
                isSystem: r.isSystem,
                requiredRenditions: { thumbnail: r.reqThumbnail, feedImage: r.reqFeedImage, hls: r.reqHls, lowQuality: r.reqLowQuality },
            }))
        } catch (e) {
            return this.profiles
        }
    }

    async createProcessingProfile(payload: Partial<ProcessingProfile>) {
        const created = await prisma.processingProfile.create({ data: ({
            name: payload.name || "",
            description: payload.description || "",
            isSystem: payload.isSystem || false,
            reqThumbnail: payload.requiredRenditions?.thumbnail ?? true,
            reqFeedImage: payload.requiredRenditions?.feedImage ?? false,
            reqHls: payload.requiredRenditions?.hls ?? false,
            reqLowQuality: payload.requiredRenditions?.lowQuality ?? false,
        } as any) })
        return { id: created.id, name: created.name, description: created.description, isSystem: created.isSystem, requiredRenditions: { thumbnail: created.reqThumbnail, feedImage: created.reqFeedImage, hls: created.reqHls, lowQuality: created.reqLowQuality } }
    }

    async logActivity(entry: { type: string; title: string; description: string; metadata?: any }) {
        try {
            const created = await prisma.activityLog.create({ data: { type: entry.type as any, title: entry.title, description: entry.description, metadata: entry.metadata ? entry.metadata : undefined } })
            return { id: created.id, type: created.type, title: created.title, description: created.description, metadata: created.metadata, timestamp: created.timestamp.toISOString() }
        } catch (e) {
            this.recentActivity.unshift({ id: `act-${Date.now()}`, type: entry.type as any, title: entry.title, description: entry.description, timestamp: new Date().toISOString() })
            return this.recentActivity[0]
        }
    }

    private seedInitialMedia() {
        const sampleImages = [
            {
                name: "IMG_2026_08_ALPS_01.jpg",
                userId: "user-1",
                collectionId: "col-1",
                rootCollectionId: "root-1",
                type: "IMAGE" as const,
                size: 5242880,
                width: 4032,
                height: 3024,
                tags: ["instagram", "travel", "mountains", "summer2026"],
                previewUrl:
                    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80",
                thumbnailUrl:
                    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200&auto=format&fit=crop&q=80",
                likesCount: 142,
                savesCount: 38,
                createdAt: "2026-08-20T10:14:00.000Z",
                overrideProfileId: null,
                status: "READY" as const,
                assets: [
                    {
                        type: "THUMBNAIL" as const,
                        status: "READY" as const,
                        path: "thumb/IMG_2026_08_ALPS_01_thumb.webp",
                        size: 45000,
                    },
                    {
                        type: "FEED_IMAGE" as const,
                        status: "READY" as const,
                        path: "feed/IMG_2026_08_ALPS_01_feed.jpg",
                        size: 450000,
                    },
                ],
            },
            {
                name: "IMG_2026_08_SUNSET_LAKE.jpg",
                userId: "user-1",
                collectionId: "col-1",
                rootCollectionId: "root-1",
                type: "IMAGE" as const,
                size: 4890000,
                width: 3840,
                height: 2160,
                tags: ["travel", "sunset", "lake", "scenic"],
                previewUrl:
                    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
                thumbnailUrl:
                    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&auto=format&fit=crop&q=80",
                likesCount: 89,
                savesCount: 19,
                createdAt: "2026-08-22T14:30:00.000Z",
                overrideProfileId: null,
                status: "NEEDS_PROCESSING" as const, // Missing feed image per Image Feed policy
                assets: [
                    {
                        type: "THUMBNAIL" as const,
                        status: "READY" as const,
                        path: "thumb/IMG_2026_08_SUNSET_LAKE_thumb.webp",
                        size: 38000,
                    },
                    { type: "FEED_IMAGE" as const, status: "MISSING" as const },
                ],
            },
            {
                name: "IMG_STUDIO_CERAMICS_402.jpg",
                userId: "user-2",
                collectionId: "col-1",
                rootCollectionId: "root-1",
                type: "IMAGE" as const,
                size: 6100000,
                width: 4200,
                height: 2800,
                tags: ["art", "ceramics", "pottery", "studio"],
                previewUrl:
                    "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80",
                thumbnailUrl:
                    "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=200&auto=format&fit=crop&q=80",
                likesCount: 310,
                savesCount: 77,
                createdAt: "2026-08-24T09:12:00.000Z",
                overrideProfileId: null,
                status: "READY" as const,
                assets: [
                    {
                        type: "THUMBNAIL" as const,
                        status: "READY" as const,
                        path: "thumb/IMG_STUDIO_CERAMICS_402_thumb.webp",
                        size: 52000,
                    },
                    {
                        type: "FEED_IMAGE" as const,
                        status: "READY" as const,
                        path: "feed/IMG_STUDIO_CERAMICS_402_feed.jpg",
                        size: 580000,
                    },
                ],
            },
            {
                name: "RAW_DISCOVERED_IMG_0099.jpg",
                userId: "user-2",
                collectionId: "col-1",
                rootCollectionId: "root-1",
                type: "IMAGE" as const,
                size: 7800000,
                width: 6000,
                height: 4000,
                tags: ["new-import", "raw"],
                previewUrl:
                    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80",
                thumbnailUrl: "",
                likesCount: 0,
                savesCount: 0,
                createdAt: "2026-08-25T06:20:00.000Z",
                overrideProfileId: null,
                status: "NEW" as const, // Newly ingested from filesystem! No thumbnail yet
                assets: [
                    { type: "THUMBNAIL" as const, status: "MISSING" as const },
                    { type: "FEED_IMAGE" as const, status: "MISSING" as const },
                ],
            },
            {
                name: "CORRUPTED_HDR_PHOTO_88.jpg",
                userId: "user-2",
                collectionId: "col-1",
                rootCollectionId: "root-1",
                type: "IMAGE" as const,
                size: 9400000,
                width: 5400,
                height: 3600,
                tags: ["hdr", "failed"],
                previewUrl:
                    "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&auto=format&fit=crop&q=80",
                thumbnailUrl:
                    "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=200&auto=format&fit=crop&q=80",
                likesCount: 12,
                savesCount: 2,
                createdAt: "2026-08-21T18:00:00.000Z",
                overrideProfileId: null,
                status: "FAILED" as const,
                processingError: {
                    stage: "Feed image generation",
                    message: "libvips error: Corrupted EXIF color profile header at offset 0x48",
                    timestamp: "2026-08-21T18:02:15.000Z",
                },
                assets: [
                    {
                        type: "THUMBNAIL" as const,
                        status: "READY" as const,
                        path: "thumb/CORRUPTED_HDR_PHOTO_88_thumb.webp",
                        size: 39000,
                    },
                    {
                        type: "FEED_IMAGE" as const,
                        status: "FAILED" as const,
                        error: "libvips header error",
                    },
                ],
            },
            {
                name: "FAMILY_PICNIC_AUGUST_2026.jpg",
                userId: "user-4",
                collectionId: "col-3",
                rootCollectionId: "root-2",
                type: "IMAGE" as const,
                size: 3400000,
                width: 3200,
                height: 2400,
                tags: ["family", "picnic", "summer2026"],
                previewUrl:
                    "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop&q=80",
                thumbnailUrl:
                    "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=200&auto=format&fit=crop&q=80",
                likesCount: 45,
                savesCount: 12,
                createdAt: "2026-08-18T12:00:00.000Z",
                overrideProfileId: null, // Inherits Direct -> requires only Thumbnail
                status: "READY" as const,
                assets: [
                    {
                        type: "THUMBNAIL" as const,
                        status: "READY" as const,
                        path: "thumb/FAMILY_PICNIC_thumb.webp",
                        size: 28000,
                    },
                ],
            },
            {
                name: "OLD_TRIP_DELETED_SAMPLE.jpg",
                userId: "user-1",
                collectionId: "col-1",
                rootCollectionId: "root-1",
                type: "IMAGE" as const,
                size: 2100000,
                width: 2400,
                height: 1600,
                tags: ["deleted", "trash"],
                previewUrl:
                    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&auto=format&fit=crop&q=80",
                thumbnailUrl:
                    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&auto=format&fit=crop&q=80",
                likesCount: 5,
                savesCount: 0,
                createdAt: "2026-07-15T08:00:00.000Z",
                deletedAt: "2026-08-23T11:00:00.000Z", // Soft-deleted!
                overrideProfileId: null,
                status: "READY" as const,
                assets: [
                    {
                        type: "THUMBNAIL" as const,
                        status: "READY" as const,
                        path: "thumb/OLD_TRIP_thumb.webp",
                        size: 24000,
                    },
                ],
            },
        ]

        const sampleVideos = [
            {
                name: "REEL_URBAN_SKATE_4K.mp4",
                userId: "user-3",
                collectionId: "col-2",
                rootCollectionId: "root-1",
                type: "VIDEO" as const,
                size: 48500000,
                width: 1080,
                height: 1920,
                duration: 28.5,
                bitrate: 13500,
                tags: ["tiktok", "reels", "skate", "urban"],
                previewUrl:
                    "https://images.unsplash.com/photo-1564982752979-3f7bc974d29a?w=800&auto=format&fit=crop&q=80",
                thumbnailUrl:
                    "https://images.unsplash.com/photo-1564982752979-3f7bc974d29a?w=200&auto=format&fit=crop&q=80",
                likesCount: 890,
                savesCount: 240,
                createdAt: "2026-08-23T16:45:00.000Z",
                overrideProfileId: null, // user-3 uses 'profile-video-hq-lq' -> requires Thumbnail, HLS, LowQuality
                status: "READY" as const,
                assets: [
                    {
                        type: "THUMBNAIL" as const,
                        status: "READY" as const,
                        path: "thumb/REEL_URBAN_SKATE_thumb.webp",
                        size: 55000,
                    },
                    {
                        type: "HLS" as const,
                        status: "READY" as const,
                        path: "hls/REEL_URBAN_SKATE/master.m3u8",
                        size: 32000000,
                    },
                    {
                        type: "LOW_QUALITY" as const,
                        status: "READY" as const,
                        path: "lq/REEL_URBAN_SKATE_720p.mp4",
                        size: 12000000,
                    },
                ],
            },
            {
                name: "REEL_COFFEE_BREW_LATTE.mp4",
                userId: "user-3",
                collectionId: "col-2",
                rootCollectionId: "root-1",
                type: "VIDEO" as const,
                size: 36200000,
                width: 1080,
                height: 1920,
                duration: 18.2,
                bitrate: 15800,
                tags: ["coffee", "barista", "reels", "morning"],
                previewUrl:
                    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80",
                thumbnailUrl:
                    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&auto=format&fit=crop&q=80",
                likesCount: 450,
                savesCount: 112,
                createdAt: "2026-08-24T08:30:00.000Z",
                overrideProfileId: null,
                status: "NEEDS_PROCESSING" as const, // Missing Low Quality rendition
                assets: [
                    {
                        type: "THUMBNAIL" as const,
                        status: "READY" as const,
                        path: "thumb/REEL_COFFEE_BREW_thumb.webp",
                        size: 48000,
                    },
                    {
                        type: "HLS" as const,
                        status: "READY" as const,
                        path: "hls/REEL_COFFEE_BREW/master.m3u8",
                        size: 22000000,
                    },
                    { type: "LOW_QUALITY" as const, status: "MISSING" as const },
                ],
            },
            {
                name: "RAW_INGEST_DRONE_CLIFFS.mp4",
                userId: "user-3",
                collectionId: "col-2",
                rootCollectionId: "root-1",
                type: "VIDEO" as const,
                size: 142000000,
                width: 3840,
                height: 2160,
                duration: 45.0,
                bitrate: 25000,
                tags: ["drone", "cinematic", "new-import"],
                previewUrl:
                    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&auto=format&fit=crop&q=80",
                thumbnailUrl: "",
                likesCount: 0,
                savesCount: 0,
                createdAt: "2026-08-25T07:10:00.000Z",
                overrideProfileId: null,
                status: "NEW" as const, // Newly ingested
                assets: [
                    { type: "THUMBNAIL" as const, status: "MISSING" as const },
                    { type: "HLS" as const, status: "MISSING" as const },
                    { type: "LOW_QUALITY" as const, status: "MISSING" as const },
                ],
            },
            {
                name: "FAIL_CORRUPT_CODEC_TEST.mp4",
                userId: "user-3",
                collectionId: "col-2",
                rootCollectionId: "root-1",
                type: "VIDEO" as const,
                size: 18000000,
                width: 1920,
                height: 1080,
                duration: 12.0,
                bitrate: 12000,
                tags: ["test", "failed-video"],
                previewUrl:
                    "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80",
                thumbnailUrl:
                    "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80",
                likesCount: 0,
                savesCount: 0,
                createdAt: "2026-08-22T20:15:00.000Z",
                overrideProfileId: null,
                status: "FAILED" as const,
                processingError: {
                    stage: "HLS generation",
                    message:
                        "ffmpeg exited with code 1: [h264 @ 0x55bc12] non-existing PPS 0 referenced",
                    timestamp: "2026-08-22T20:17:40.000Z",
                },
                assets: [
                    {
                        type: "THUMBNAIL" as const,
                        status: "READY" as const,
                        path: "thumb/FAIL_CORRUPT_CODEC_thumb.webp",
                        size: 31000,
                    },
                    {
                        type: "HLS" as const,
                        status: "FAILED" as const,
                        error: "ffmpeg non-existing PPS 0 referenced",
                    },
                    { type: "LOW_QUALITY" as const, status: "MISSING" as const },
                ],
            },
            {
                name: "IN_TRANSCODE_STORM_CHASE.mp4",
                userId: "user-3",
                collectionId: "col-2",
                rootCollectionId: "root-1",
                type: "VIDEO" as const,
                size: 92000000,
                width: 1920,
                height: 1080,
                duration: 35.0,
                bitrate: 21000,
                tags: ["weather", "storm", "chase"],
                previewUrl:
                    "https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?w=800&auto=format&fit=crop&q=80",
                thumbnailUrl:
                    "https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?w=200&auto=format&fit=crop&q=80",
                likesCount: 15,
                savesCount: 4,
                createdAt: "2026-08-25T07:40:00.000Z",
                overrideProfileId: null,
                status: "PROCESSING" as const, // Currently processing
                assets: [
                    {
                        type: "THUMBNAIL" as const,
                        status: "READY" as const,
                        path: "thumb/IN_TRANSCODE_STORM_thumb.webp",
                        size: 42000,
                    },
                    { type: "HLS" as const, status: "PROCESSING" as const },
                    { type: "LOW_QUALITY" as const, status: "MISSING" as const },
                ],
            },
        ]

        let idCounter = 1
        ;[...sampleImages, ...sampleVideos].forEach((item) => {
            const mediaId = `media-${idCounter++}`
            const assets: MediaAsset[] = item.assets.map((a, idx) => {
                const base = {
                    id: `asset-${mediaId}-${idx + 1}`,
                    mediaId,
                    type: a.type,
                    status: a.status,
                    generatedAt: a.status === "READY" ? "2026-08-24T12:00:00.000Z" : undefined,
                }
                const withPath = (a as any).path ? { path: (a as any).path } : {}
                const withSize = (a as any).size ? { size: (a as any).size } : {}
                const withError = (a as any).error ? { error: (a as any).error } : {}
                return { ...base, ...withPath, ...withSize, ...withError }
            })

            const collection = this.collections.find((c) => c.id === item.collectionId)
            const rootCollection = this.rootCollections.find((r) => r.id === item.rootCollectionId)
            const user = this.mediaUsers.find((u) => u.id === item.userId)

            const path = `${rootCollection?.path || "root"}/${collection?.path || "col"}/${user?.username || "user"}/${item.name}`

            this.media.push({
                id: mediaId,
                name: item.name,
                type:
                    item.type === "IMAGE"
                        ? MediaType.IMAGE
                        : MediaType.VIDEO,
                path,
                size: item.size,
                width: item.width,
                height: item.height,
                duration: (item as any).duration,
                bitrate: (item as any).bitrate,
                mktime: item.createdAt,
                createdAt: item.createdAt,
                updatedAt: item.createdAt,
                deletedAt: (item as any).deletedAt || null,
                userId: item.userId,
                userName: user?.displayName,
                collectionId: item.collectionId,
                collectionName: collection?.name,
                rootCollectionId: item.rootCollectionId,
                rootCollectionName: rootCollection?.name,
                processingProfileId: item.overrideProfileId,
                visibility: null, // Inherit
                allowedUserIds: [],
                tags: item.tags,
                likesCount: item.likesCount,
                savesCount: item.savesCount,
                previewUrl: item.previewUrl,
                thumbnailUrl: item.thumbnailUrl,
                assets,
                processingStatus: item.status,
                processingError: (item as any).processingError || null,
            })
        })
    }

    private seedInitialActivity() {
        this.recentActivity = [
            {
                id: "act-1",
                type: "DISCOVERY",
                title: "New media discovered",
                description:
                    "Discovered RAW_DISCOVERED_IMG_0099.jpg and RAW_INGEST_DRONE_CLIFFS.mp4 in filesystem",
                timestamp: "2026-08-25T07:10:00.000Z",
            },
            {
                id: "act-2",
                type: "FAILED",
                title: "Video transcode failed",
                description: "FAIL_CORRUPT_CODEC_TEST.mp4 failed at HLS stage (ffmpeg code 1)",
                timestamp: "2026-08-22T20:17:40.000Z",
            },
            {
                id: "act-3",
                type: "PROCESSED",
                title: "Batch processing completed",
                description:
                    "Successfully generated HLS & 720p renditions for REEL_URBAN_SKATE_4K.mp4",
                timestamp: "2026-08-23T16:50:00.000Z",
            },
            {
                id: "act-4",
                type: "POLICY_CHANGE",
                title: "Processing profile updated",
                description:
                    'User @jordan_reels set profile override to "Video Feed + Low Quality"',
                timestamp: "2026-08-23T14:10:00.000Z",
            },
        ]
    }
}

export const db = new DatabaseStore()

// Kick off background sync to mirror persisted admin & sessions into memory
;(async () => {
    try {
        await db.loadFromDatabase()
    } catch (e) {
        console.error("Failed to sync db from Prisma:", e)
    }
})()
