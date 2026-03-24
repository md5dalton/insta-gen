import prisma from "@/lib/prisma"
import { MediaType } from "@/types/type"
import { Prisma } from "@/prisma/generated/client"


export type Reel = Prisma.MediaGetPayload<{
    select: typeof reelSelect
}>

const reelSelect = {
    id: true,
    owner: {
        select: {
            id: true,
            name: true,
            picture: true,
        }
    }
} satisfies Prisma.MediaSelect


export const getReel = async (id: string): Promise<Reel | null> => await prisma.media.findFirst({
    where: {
        id,
        type: MediaType.VIDEO,
    },
    select: reelSelect,
})

export const getUserReels = async (
    userId: string,
    cursorId?: string,
    take: number = 10
): Promise<Reel[]> => await prisma.media.findMany({
    where: {
        ownerId: userId,
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
    select: reelSelect,
})

export const getRandom = async (
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
            ) as owner
        FROM "Media" m
        JOIN "User" u ON u.id = m."ownerId"
        WHERE m.type = ${MediaType.VIDEO}::"MediaType"
        ORDER BY 
            (m.random < ${r}),
            m.random
        LIMIT ${limit}
        `
}