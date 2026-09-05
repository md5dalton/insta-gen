import prisma from "@/lib/prisma"
import type { MediaUser, MediaUserAllowedUser } from "@/prisma/generated/client"

type MediaUserRow = Omit<MediaUser, "deletedAt" | "allowedUsers"> & {
    deletedAt: string | null
    allowedUserIds: string[]
}

export const list = async (): Promise<MediaUserRow[]> => {
    const recs: Array<MediaUser & { allowedUsers?: MediaUserAllowedUser[] }> = await prisma.mediaUser.findMany({ include: { allowedUsers: true } })

    return recs.map((r) => {
        const { allowedUsers, deletedAt, ...rest } = r
        return {
            ...rest,
            deletedAt: deletedAt ? deletedAt.toISOString() : null,
            allowedUserIds: (allowedUsers ?? []).map((u) => u.profileUserId),
        }
    })
}

export const exists = async (id: string): Promise<boolean> => {
    const count = await prisma.mediaUser.count({ where: { id } })
    return count > 0
}

export default { list, exists }
