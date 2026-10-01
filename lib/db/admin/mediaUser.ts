import prisma from "@/lib/prisma"
import type { VisibilityType } from "@/prisma/generated/client"

type MediaUser = {
    id: string
    path: string
    name: string
    visibility: VisibilityType
    processingProfileId: string | null,
    collectionId: string,
    deletedAt: Date | null
    allowedUsers: string[]
}

export const list = async (): Promise<MediaUser[]> => {
    const rows = await prisma.mediaUser.findMany({ select: {
        id: true,
        path: true,
        name: true,
        visibility: true,
        processingProfileId: true,
        collectionId: true,
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
    const count = await prisma.mediaUser.count({ where: { id } })
    return count > 0
}

export default { list, exists }
