
import prisma from "@/lib/prisma"
import type { RootCollection, RootCollectionAllowedUser } from "@/prisma/generated/client"

type RootCollectionRow = Omit<RootCollection, "deletedAt" | "allowedUsers"> & {
    deletedAt: string | null
    allowedUserIds: string[]
}

export const list = async (): Promise<RootCollectionRow[]> => {
    const recs: Array<RootCollection & { allowedUsers?: RootCollectionAllowedUser[] }> = await prisma.rootCollection.findMany({ include: { allowedUsers: true } })

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
    const count = await prisma.rootCollection.count({ where: { id } })

    return count ? true : false
}
