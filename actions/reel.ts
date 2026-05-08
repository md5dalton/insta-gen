import prisma from "@/lib/prisma"
import { MediaType } from "@/types/type"
import { Prisma } from "@/prisma/generated/client"


type ReelBase = Prisma.MediaGetPayload<{
    select: ReturnType<typeof reelSelect>
}>

export type Reel = Omit<ReelBase, "likes" | "saves" | "tags"> & {
    tags: {
        id: string
        name: string
    }[]
    liked: boolean
    saved: boolean
}

export const reelSelect = (userId: string) => ({
    id: true,
    owner: {
        select: {
            id: true,
            name: true,
            picture: true,
        }
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
}) satisfies Prisma.MediaSelect

export const mapReel = (reel: ReelBase): Reel => {
    const { likes, saves, tags, ...rest } = reel

    return {
        ...rest,
        tags: tags.map(({ tag }) => tag),
        liked: likes.length > 0,
        saved: saves.length > 0,
    }
}

export const getReel = async (
    id: string,
    userId: string
): Promise<Reel | null> => {
    const reel = await prisma.media.findFirst({
        where: {
            id,
            type: MediaType.VIDEO,
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
    
    const reels = await prisma.media.findMany({
        where: {
            ownerId,
            type: MediaType.VIDEO,
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
export const getRandom = async (
    userId: string,
    limit: number = 10
): Promise<Reel[]> => {
    const r = Math.random()

    return await prisma.$queryRaw<Reel[]>`
        SELECT 
            m.id,

            json_build_object(
                'id', u.id,
                'name', u.name,
                'picture', u.picture
            ) as owner,

            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object(
                        'id', t.id,
                        'name', t.name
                    )
                ) FILTER (WHERE t.id IS NOT NULL),
                '[]'
            ) as tags,

            EXISTS (
                SELECT 1
                FROM "Like" l
                WHERE l."mediaId" = m.id
                AND l."userId" = ${userId}
            ) as liked,

            EXISTS (
                SELECT 1
                FROM "Save" s
                WHERE s."mediaId" = m.id
                AND s."userId" = ${userId}
            ) as saved

        FROM "Media" m

        JOIN "User" u
            ON u.id = m."ownerId"

        LEFT JOIN "MediaTag" mt
            ON mt."mediaId" = m.id

        LEFT JOIN "Tag" t
            ON t.id = mt."tagId"

        WHERE m.type = ${MediaType.VIDEO}::"MediaType"

        GROUP BY m.id, u.id

        ORDER BY 
            (m.random < ${r}),
            m.random

        LIMIT ${limit}
    `
}