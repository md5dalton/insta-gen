import prisma from "@/lib/prisma"
import { Prisma } from "@/prisma/generated/client"
import { MediaType } from "@/prisma/generated/enums"

type PostBase = Prisma.MediaGetPayload<{
    select: ReturnType<typeof postSelect>
}>

export type Post = Omit<PostBase, "likes" | "saves"> & {
    liked: boolean
    saved: boolean
}

export const mapPost = (post: PostBase): Post => {
    const { likes, saves, ...rest } = post

    return {
        ...rest,
        liked: likes.length > 0,
        saved: saves.length > 0,
    }
}

export const postSelect = (userId: string) => ({
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

    likes: {
        where: { userId: userId },
        select: { userId: true }
    },

    saves: {
        where: { userId: userId },
        select: { userId: true },
    }
}) satisfies Prisma.MediaSelect

export const getPost = async (id: string, userId: string): Promise<Post | null> => {
    const post = await prisma.media.findFirst({
        where: {
            id,
            type: MediaType.IMAGE,
        },
        select: postSelect(userId)
    })

    return post ? mapPost(post) : null
}

export const getUserPosts = async (
    userId: string,
    ownerId: string,
    cursorId?: string,
    take: number = 10
): Promise<Post[]> => {
    const posts = await prisma.media.findMany({
        where: {
            ownerId: ownerId,
            type: MediaType.IMAGE,
        },
        ...(cursorId && {
            cursor: { id: cursorId },
            skip: 1,
        }),
        take,
        orderBy: {
            createdAt: "asc",
        },
        select: postSelect(userId),
    })
    
    return posts.map(post => mapPost(post))
}

export const getRandom = async (
    userId: string,
    limit: number = 10
): Promise<Post[]> => {
    const r = Math.random()

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
                        'tag',
                        jsonb_build_object(
                            'id', t.id,
                            'name', t.name
                        )
                    )
                ) FILTER (WHERE t.id IS NOT NULL),
                '[]'
            ) as tags,

            -- ✅ liked flag
            EXISTS (
                SELECT 1
                FROM "Like" l
                WHERE l."mediaId" = m.id
                AND l."userId" = ${userId}
            ) as liked,

            -- ✅ saved flag
            EXISTS (
                SELECT 1
                FROM "Save" s
                WHERE s."mediaId" = m.id
                AND s."userId" = ${userId}
            ) as saved

        FROM "Media" m
        JOIN "User" u ON u.id = m."ownerId"

        LEFT JOIN "MediaTag" mt ON mt."mediaId" = m.id
        LEFT JOIN "Tag" t ON t.id = mt."tagId"

        GROUP BY m.id, u.id

        ORDER BY 
            (m.random < ${r}),
            m.random
        LIMIT ${limit}
    `
}