import prisma from "@/lib/prisma"
import type { Collection, CollectionAllowedUser } from "@/prisma/generated/client"

type CollectionRow = Omit<Collection, "deletedAt" | "allowedUsers"> & {
    deletedAt: string | null
    allowedUserIds: string[]
}

export const list = async (): Promise<CollectionRow[]> => {
    const recs: Array<Collection & { allowedUsers?: CollectionAllowedUser[] }> = await prisma.collection.findMany({ include: { allowedUsers: true } })

    return recs.map((r) => {
        const { allowedUsers, deletedAt, ...rest } = r
        return {
            ...rest,
            deletedAt: deletedAt ? deletedAt.toISOString() : null,
            allowedUserIds: (allowedUsers ?? []).map((u) => u.userId),
        }
    })
}

export const exists = async (id: string): Promise<boolean> => {
    const count = await prisma.collection.count({ where: { id } })
    return count > 0
}

export default { list, exists }
