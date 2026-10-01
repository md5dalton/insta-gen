import { NextResponse } from "next/server"
import { db } from "@/server/db"
import prisma from "@/lib/prisma"
import { authenticateRequest } from "@/server/auth"
import { JobEvent, VisibilityType } from "@/prisma/generated/enums"
import { EntityType } from "@/context/HierarchyContext"
import { exists as rootCollectionExists } from "@/lib/db/admin/rootCollection"
import { exists as collectionExists } from "@/lib/db/admin/collection"
import { exists as userExists } from "@/lib/db/admin/mediaUser"

export async function PUT(request: any, context: any) {
    const params =
        context?.params && typeof context.params.then === "function"
            ? await context.params
            : context?.params

    const admin = await authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { type, id } = params

    const { processingProfileId, visibility, allowedUserIds, deleted } = await request.json()

    let result: any = null
    
    try {
        const targetExists = await exists(type, id)

        if (!targetExists) return NextResponse.json({ error: `${type} not found` }, { status: 404 })

        if (visibility) result = await setVisibility(type, id, visibility)
        if (allowedUserIds.length) await setAllowedUsers(type, id, allowedUserIds)
        if (deleted) result = await setDeleted(type, id)
        if (processingProfileId) result = await setProcessingProfile(type, id, processingProfileId)

        await db.logActivity({ type: "POLICY_CHANGE", title: `${type} policy modified`, description: `Updated configuration for "${result.name}"` })
        
        return NextResponse.json({
            success: true,
            data: {
                name: result.name
            }
        })
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || String(e) }, { status: 400 })
    }
}

const setProcessingProfile = async (type: EntityType, id: string, profileId: string): Promise<{id: string} | null> => {
    
    if (profileId !== "DEFAULT") {
        const processingProfile = await prisma.processingProfile.count({ where: {id: profileId} })
    
        if (!processingProfile) throw new Error("unknown processing profile")
    }

    let result = null
        
    if (type === "ROOT_COLLECTION") {
        result = await prisma.rootCollection.update({
            where: { id },
            data: {
                processingProfileId: profileId === "DEFAULT" ? null : profileId
            }
        })
    } else if (type === "COLLECTION") {
        result = await prisma.collection.update({
            where: { id },
            data: {
                processingProfileId: profileId === "DEFAULT" ? null : profileId
            }
        })
    } else if (type === "USER") {
        result = await prisma.mediaUser.update({
            where: { id },
            data: {
                processingProfileId: profileId === "DEFAULT" ? null : profileId
            }
        })
    }

    if (result && profileId !== "DEFAULT") {
        try {
            const dedupeKey = `profile-update:${type}:${id}`
            await prisma.job.upsert({
                where: { dedupeKey },
                update: {
                    status: "PENDING"
                },
                create: {
                    type, event: JobEvent.UPDATE, payload: { id }, dedupeKey 
                }
            })
        } catch (e) {
            // ignore duplicate job errors
        }
    }

    return result
}

const exists = async (type: EntityType, id: string): Promise<boolean> => {
    if (type === "ROOT_COLLECTION") {
        return await rootCollectionExists(id)
    } else if (type === "COLLECTION") {
        return await collectionExists(id)
    } else if (type === "USER") {
        return await userExists(id)
    }
    return false
}

const setVisibility = async (type: EntityType, id: string, visibility: VisibilityType): Promise<{id: string} | null | undefined> => {
    if (type === "ROOT_COLLECTION") {
        return await prisma.rootCollection.update({
            where: { id },
            data: {
                visibility: visibility === "INHERIT" ? "RESTRICTED" : visibility
            }
        })
    } else if (type === "COLLECTION") {
        return await prisma.collection.update({
            where: { id },
            data: {
                visibility
            }
        })
    } else if (type === "USER") {
        return await prisma.mediaUser.update({
            where: { id },
            data: {
                visibility
            }
        })
    }
}

const setDeleted = async (type: EntityType, id: string): Promise<{id: string} | null | undefined> => {
    if (type === "ROOT_COLLECTION") {
        return await prisma.rootCollection.update({
            where: { id },
            data: {
                deletedAt: new Date().toISOString()
            }
        })
    } else if (type === "COLLECTION") {
        return await prisma.collection.update({
            where: { id },
            data: {
                deletedAt: new Date().toISOString()
            }
        })
    } else if (type === "USER") {
        return await prisma.mediaUser.update({
            where: { id },
            data: {
                deletedAt: new Date().toISOString()
            }
        })
    }
}

const setAllowedUsers = async (type: EntityType, id: string, allowedUsers: string[]) => {
    if (type === "ROOT_COLLECTION") {
        await prisma.rootCollectionAllowedUser.deleteMany({where: {rootCollectionId: id}})
        
        const rows = allowedUsers.map(user => ({ rootCollectionId: id, userId: user }))

        try { await prisma.rootCollectionAllowedUser.createMany({ data: rows }) } catch (e) {}

    } else if (type === "COLLECTION") {
        await prisma.collectionAllowedUser.deleteMany({where: {collectionId: id}})
        
        const rows = allowedUsers.map(user => ({ collectionId: id, userId: user }))

        try { await prisma.collectionAllowedUser.createMany({ data: rows }) } catch (e) {}

    } else if (type === "USER") {
        await prisma.mediaUserAllowedUser.deleteMany({where: {mediaUserId: id}})
        
        const rows = allowedUsers.map(user => ({ mediaUserId: id, userId: user }))

        try { await prisma.mediaUserAllowedUser.createMany({ data: rows }) } catch (e) {}
    }
}

