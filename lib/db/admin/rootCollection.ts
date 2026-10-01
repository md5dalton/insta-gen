import prisma from "@/lib/prisma"
import type { VisibilityType } from "@/prisma/generated/client"

type RootCollection = {
    id: string
    path: string
    name: string
    visibility: VisibilityType
    processingProfileId: string | null,
    deletedAt: Date | null
    allowedUsers: string[]
}

export const list = async (): Promise<RootCollection[]> => {
    const rows = await prisma.rootCollection.findMany({ select: {
        id: true,
        path: true,
        name: true,
        visibility: true,
        processingProfileId: true,
        deletedAt: true,
        allowedUsers: {
            select: {
                userId: true
            }
        }
    } })

    return rows.map(({allowedUsers, ...row}) => ({
        ...row,
        allowedUsers: (allowedUsers ?? []).map((u) => u.userId),
    }))
}

export const exists = async (id: string): Promise<boolean> => {
    const count = await prisma.rootCollection.count({ where: { id } })

    return count ? true : false
}
