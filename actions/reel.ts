import prisma from "@/lib/prisma"
import { mediaWhere } from "@/actions/post"
import { MediaType, Prisma } from "@/prisma/generated/client"

type ReelBase = Prisma.MediaItemGetPayload<{
    select: ReturnType<typeof reelSelect>
}>

export type Reel = Omit<ReelBase, "user" | "likes" | "saves" | "tags"> & {
    owner: {
        id: string
        name: string
        picture: string | null
    }
    tags: {
        id: string
        name: string
    }[]
    liked: boolean
    saved: boolean
}

export const reelSelect = (userId: string) =>
    ({
        id: true,
        user: {
            select: {
                id: true,
                path: true,
                picture: true,
            },
        },

        tags: {
            select: {
                tag: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        },

        likes: {
            where: { userId },
            select: { userId: true },
        },

        saves: {
            where: { userId },
            select: { userId: true },
        },
    }) satisfies Prisma.MediaItemSelect

export const mapReel = (reel: ReelBase): Reel => {
    const { user, likes, saves, tags, ...rest } = reel

    return {
        ...rest,
        owner: {
            id: user.id,
            name: user.path.split(/[\\/]/).filter(Boolean).pop() || user.path,
            picture: user.picture,
        },
        tags: tags.map(({ tag }) => tag),
        liked: likes.length > 0,
        saved: saves.length > 0,
    }
}

export const getReel = async (id: string, userId: string): Promise<Reel | null> => {
    const reel = await prisma.mediaItem.findFirst({
        where: {
            id,
            ...(await mediaWhere(userId, undefined, MediaType.VIDEO)),
        },
        select: reelSelect(userId),
    })

    return reel ? mapReel(reel) : null
}

export const getUserReels = async (
    userId: string,
    ownerId: string,
    cursorId?: string,
    take: number = 10
): Promise<Reel[]> => {
    const reels = await prisma.mediaItem.findMany({
        where: {
            ...(await mediaWhere(userId, ownerId, MediaType.VIDEO)),
        },
        ...(cursorId && {
            cursor: { id: cursorId },
            skip: 1, // important!
        }),
        take,
        orderBy: {
            createdAt: "asc",
        },
        select: reelSelect(userId),
    })

    return reels.map(mapReel)
}
export const getRandom = async (userId: string, limit: number = 10): Promise<Reel[]> => {
    const boundary = Math.random()
    const where = await mediaWhere(userId, undefined, MediaType.VIDEO)
    const select = reelSelect(userId)
    const firstBatch = await prisma.mediaItem.findMany({
        where: { ...where, random: { gte: boundary } },
        orderBy: { random: "asc" },
        take: limit,
        select,
    })

    if (firstBatch.length === limit) return firstBatch.map(mapReel)

    const wrappedBatch = await prisma.mediaItem.findMany({
        where: { ...where, random: { lt: boundary } },
        orderBy: { random: "asc" },
        take: limit - firstBatch.length,
        select,
    })

    return [...firstBatch, ...wrappedBatch].map(mapReel)
}
