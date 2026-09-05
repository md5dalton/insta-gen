import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { authenticateRequest } from "@/server/auth"
import { list as listRootCollections } from "@/lib/db/admin/rootCollection"
import { list as listCollections } from "@/lib/db/admin/collection"
import { list as listMediaUsers } from "@/lib/db/admin/mediaUser"

export async function GET(request: Request) {
    const admin = await authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Use Prisma grouping to compute counts per media user without loading all media rows
    const allRoots = await listRootCollections()
    const allCollections = await listCollections()
    const allMediaUsers = await listMediaUsers()

    const totalByUser = await prisma.mediaItem.groupBy({ by: ["userId"], _count: { _all: true } })
    const activeByUser = await prisma.mediaItem.groupBy({ where: { deletedAt: null }, by: ["userId"], _count: { _all: true } })

    const totalMap = new Map<string, number>(totalByUser.map((r) => [r.userId, r._count._all]))
    const activeMap = new Map<string, number>(activeByUser.map((r) => [r.userId, r._count._all]))

    const roots = allRoots.map((root) => {
        const rootCols = allCollections.filter((c) => c.rootCollectionId === root.id)
        const collections = rootCols.map((col) => {
            const colUsers = allMediaUsers.filter((u) => u.collectionId === col.id)
            const users = colUsers.map((user) => {
                const total = totalMap.get(user.id) || 0
                const active = activeMap.get(user.id) || 0
                return {
                    ...user,
                    effectiveProfile: null,
                    effectiveVisibility: "ALL_USERS",
                    effectiveAllowedUserIds: [],
                    isEffectivelyDeleted: false,
                    mediaCount: total,
                    activeMediaCount: active,
                }
            })
            const mediaCount = users.reduce((s, u) => s + (u.mediaCount || 0), 0)
            const activeCount = users.reduce((s, u) => s + (u.activeMediaCount || 0), 0)
            return {
                ...col,
                effectiveProfile: null,
                effectiveVisibility: "ALL_USERS",
                effectiveAllowedUserIds: [],
                isEffectivelyDeleted: false,
                users,
                mediaCount,
                activeMediaCount: activeCount,
            }
        })
        const mediaCount = collections.reduce((s, c) => s + (c.mediaCount || 0), 0)
        const activeCount = collections.reduce((s, c) => s + (c.activeMediaCount || 0), 0)

        return {
            ...root,
            effectiveProfile: null,
            effectiveVisibility: "ALL_USERS",
            effectiveAllowedUserIds: [],
            isEffectivelyDeleted: false,
            collections,
            mediaCount,
            activeMediaCount: activeCount,
        }
    })
    
    return NextResponse.json(roots)
}
