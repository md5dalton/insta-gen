import prisma from "@/lib/prisma"
import { Prisma } from "@/prisma/generated/client"
import { MediaType } from "@/prisma/generated/enums"

export type Post = Prisma.MediaGetPayload<{
    select: typeof postSelect
}>

export const postSelect = {
    id: true,
    type: true,
    height: true,
    width: true,
    owner: {
        select: {
            id: true,
            name: true,
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
} satisfies Prisma.MediaSelect

export const getPost = async (id: string): Promise<Post | null> => await prisma.media.findFirst({
    where: {
        id,
        type: MediaType.IMAGE,
    },
    select: postSelect,
})

export const getUserPosts = async (
    userId: string,
    cursorId?: string,
    take: number = 10
): Promise<Post[]> => await prisma.media.findMany({
    where: {
        ownerId: userId,
        type: MediaType.IMAGE,
    },
    ...(cursorId && {
        cursor: { id: cursorId },
        skip: 1, // important!
    }),
    take,
    orderBy: {
        createdAt: "asc",
    },
    select: postSelect,
})

export const getRandom = async (
    limit: number = 10
): Promise<Post[]> => {
    
    const count = await prisma.media.count()
    const offset = Math.floor(Math.random() * count)
    
    return await prisma.$queryRaw`
        SELECT 
            m.id,
            m.type,
            m.height,
            m.width,
            m.duration,

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
            ) as tags

        FROM "Media" m
        JOIN "User" u ON u.id = m."ownerId"

        LEFT JOIN "MediaTag" mt ON mt."mediaId" = m.id
        LEFT JOIN "Tag" t ON t.id = mt."tagId"

        GROUP BY m.id, u.id

        OFFSET ${offset}
        LIMIT ${limit}
    `
}