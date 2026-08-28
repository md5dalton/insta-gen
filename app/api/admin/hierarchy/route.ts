import { NextResponse } from "next/server"
import { db } from "@/server/db"
import { enrichMediaItem } from "@/server/policy"
import { authenticateRequest } from "@/server/auth"

export async function GET(request: Request) {
    const admin = await authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const enrichedMedia = await Promise.all((await db.listMedia()).map((m) => enrichMediaItem(m)))
    const allRoots = await db.listRootCollections()
    const allCollections = await db.listCollections()
    const allMediaUsers = await db.listMediaUsers()
    const roots = allRoots.map((root) => {
        const rootCols = allCollections.filter((c) => c.rootCollectionId === root.id)
        const collections = rootCols.map((col) => {
            const colUsers = allMediaUsers.filter((u) => u.collectionId === col.id)
            const users = colUsers.map((user) => {
                const userMedia = enrichedMedia.filter((m) => m.userId === user.id)
                return {
                    ...user,
                    effectiveProfile: null,
                    effectiveVisibility: "ALL_USERS",
                    effectiveAllowedUserIds: [],
                    isEffectivelyDeleted: false,
                    mediaCount: userMedia.length,
                    activeMediaCount: userMedia.filter((m) => !m.isEffectivelyDeleted).length,
                }
            })
            const colMedia = enrichedMedia.filter((m) => m.collectionId === col.id)
            return {
                ...col,
                effectiveProfile: null,
                effectiveVisibility: "ALL_USERS",
                effectiveAllowedUserIds: [],
                isEffectivelyDeleted: false,
                users,
                mediaCount: colMedia.length,
                activeMediaCount: colMedia.filter((m) => !m.isEffectivelyDeleted).length,
            }
        })
        const rootMedia = enrichedMedia.filter((m) => m.rootCollectionId === root.id)
        return {
            ...root,
            effectiveProfile: null,
            effectiveVisibility: "ALL_USERS",
            effectiveAllowedUserIds: [],
            isEffectivelyDeleted: false,
            collections,
            mediaCount: rootMedia.length,
            activeMediaCount: rootMedia.filter((m) => !m.isEffectivelyDeleted).length,
        }
    })
    return NextResponse.json({ roots })
}
