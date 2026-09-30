import prisma from "@/lib/prisma"
import { Prisma } from "@/prisma/generated/client"

type PostBase = Prisma.MediaItemGetPayload<{
    select: ReturnType<typeof postSelect>
}>

export type Post = Omit<PostBase, "tags" | "user"> & {
    owner: {
        id: string
        name: string
        picture: string | null
    }
    tags: {
        id: string
        name: string
    }[]
}

export const mapPost = (post: PostBase): Post => {
    const { user, tags, ...rest } = post

    return {
        ...rest,
        owner: {
            id: user.id,
            name: user.path.split(/[\\/]/).filter(Boolean).pop() || user.path,
            picture: user.picture,
        },
        tags: tags.map(({ tag }) => tag),
    }
}

export const postSelect = () =>
    ({
        id: true,
        type: true,
        height: true,
        width: true,
        likesCount: true,
        savesCount: true,
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
    }) satisfies Prisma.MediaItemSelect

const visibilityWhere = (userId: string) => ({
    NOT: { visibility: "PRIVATE" as const },
    OR: [
        { visibility: { not: "RESTRICTED" as const } },
        { allowedUsers: { some: { userId } } },
    ],
})

const mediaWhere = async (
    userId: string,
    ownerId?: string
): Promise<Prisma.MediaItemWhereInput> => {
    const profileUser = await prisma.profileUser.findUnique({
        where: { id: userId },
        select: { role: true },
    })
    const applyVisibility = profileUser?.role !== "ADMIN"

    return {
        deletedAt: null,
        user: {
            is: {
                ...(ownerId && { id: ownerId }),
                deletedAt: null,
                ...(applyVisibility && visibilityWhere(userId)),
                collection: {
                    is: {
                        deletedAt: null,
                        ...(applyVisibility && visibilityWhere(userId)),
                        rootCollection: {
                            is: {
                                deletedAt: null,
                                ...(applyVisibility && visibilityWhere(userId)),
                            },
                        },
                    },
                },
            },
        },
        ...(applyVisibility && visibilityWhere(userId)),
    }
}

export const getPost = async (id: string, userId: string): Promise<Post | null> => {
    const post = await prisma.mediaItem.findFirst({
        where: {
            id,
            ...(await mediaWhere(userId)),
        },
        select: postSelect(),
    })

    return post ? mapPost(post) : null
}

export const getUserPosts = async (
    userId: string,
    ownerId: string,
    cursorId?: string,
    take: number = 10
): Promise<Post[]> => {
    const posts = await prisma.mediaItem.findMany({
        where: {
            ...(await mediaWhere(userId, ownerId)),
        },

        ...(cursorId && {
            cursor: { id: cursorId },
            skip: 1,
        }),

        take,

        orderBy: {
            createdAt: "asc",
        },

        select: postSelect(),
    })

    return posts.map(mapPost)
}

export const getRandom = async (userId: string, limit: number = 10): Promise<Post[]> => {
    const boundary = Math.random()
    const select = postSelect()
    const where = await mediaWhere(userId)
    const firstBatch = await prisma.mediaItem.findMany({
        where: {
            ...where,
            random: { gte: boundary },
        },
        orderBy: { random: "asc" },
        take: limit,
        select,
    })

    if (firstBatch.length === limit) return firstBatch.map(mapPost)

    const wrappedBatch = await prisma.mediaItem.findMany({
        where: {
            ...where,
            random: { lt: boundary },
        },
        orderBy: { random: "asc" },
        take: limit - firstBatch.length,
        select,
    })

    return [...firstBatch, ...wrappedBatch].map(mapPost)
}
