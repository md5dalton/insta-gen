import { AuthUser } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { MediaType, Prisma, RootVisibilityType, UserRole, VisibilityType } from "@/prisma/generated/client"

type PostBase = Prisma.MediaItemGetPayload<{
    select: ReturnType<typeof postSelect>
}>

export type Post = Omit<PostBase, "tags" | "user" | "likes" | "saves"> & {
    owner: {
        id: string
        name: string
        picture: string | null
    }
    liked: boolean
    saved: boolean
    tags: {
        id: string
        name: string
    }[]
}

export const mapPost = (post: PostBase): Post => {
    const { user, tags, likes, saves, ...rest } = post

    return {
        ...rest,
        liked: likes.length > 0,
        saved: saves.length > 0,
        owner: {
            id: user.id,
            name: user.path.split(/[\\/]/).filter(Boolean).pop() || user.path,
            picture: user.picture,
        },
        tags: tags.map(({ tag }) => tag),
    }
}

export const postSelect = (userId: string) => ({
    id: true,
    type: true,
    height: true,
    width: true,
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

const visibilityWhere = (userId: string) => ({
    OR: [
        { visibility: VisibilityType.ALL_USERS },
        {
            visibility: VisibilityType.RESTRICTED,
            allowedUsers: { some: { userId } },
        },
    ],
})

const rootVisibilityWhere = (userId: string) => ({
    OR: [
        { visibility: RootVisibilityType.ALL_USERS },
        {
            visibility: RootVisibilityType.RESTRICTED,
            allowedUsers: { some: { userId } },
        },
    ],
})

export const mediaWhere = (
    user: AuthUser,
    ownerId?: string,
    type?: MediaType
): Prisma.MediaItemWhereInput => {

    const applyVisibility = user.role !== UserRole.ADMIN

    const hierarchyWhere = (
        mediaUserWhere: Prisma.MediaUserWhereInput = {},
        collectionWhere: Prisma.CollectionWhereInput = {},
        rootCollectionWhere: Prisma.RootCollectionWhereInput = {}
    ) => ({
        user: {
            is: {
                ...(ownerId && { id: ownerId }),
                deletedAt: null,
                ...mediaUserWhere,
                collection: {
                    is: {
                        deletedAt: null,
                        ...collectionWhere,
                        rootCollection: {
                            is: {
                                deletedAt: null,
                                ...rootCollectionWhere,
                            },
                        },
                    },
                },
            },
        },
    })

    return {
        deletedAt: null,
        ...(type && { type }),
        ...(applyVisibility
            ? {
                OR: [
                    {
                        AND: [
                            visibilityWhere(user.id),
                            hierarchyWhere(),
                        ],
                    },
                    {
                        AND: [
                            { visibility: VisibilityType.INHERIT },
                            hierarchyWhere(visibilityWhere(user.id)),
                        ],
                    },
                    {
                        AND: [
                            { visibility: VisibilityType.INHERIT },
                            hierarchyWhere(
                                { visibility: VisibilityType.INHERIT },
                                visibilityWhere(user.id)
                            ),
                        ],
                    },
                    {
                        AND: [
                            { visibility: VisibilityType.INHERIT },
                            hierarchyWhere(
                                { visibility: VisibilityType.INHERIT },
                                { visibility: VisibilityType.INHERIT },
                                rootVisibilityWhere(user.id)
                            ),
                        ],
                    },
                ],
            }
            : hierarchyWhere()),
    }
}

export const getPost = async (id: string, user: AuthUser): Promise<Post | null> => {
    const post = await prisma.mediaItem.findFirst({
        where: {
            id,
            ...(mediaWhere(user)),
        },
        select: postSelect(user.id),
    })

    return post ? mapPost(post) : null
}

export const getUserPosts = async (
    user: AuthUser,
    ownerId: string,
    cursorId?: string,
    take: number = 10
): Promise<Post[]> => {
    const posts = await prisma.mediaItem.findMany({
        where: {
            ...(mediaWhere(user, ownerId)),
        },

        ...(cursorId && {
            cursor: { id: cursorId },
            skip: 1,
        }),

        take,

        orderBy: {
            createdAt: "asc",
        },

        select: postSelect(user.id),
    })

    return posts.map(mapPost)
}

export const getRandom = async (user: AuthUser, limit: number = 10): Promise<Post[]> => {
    const boundary = Math.random()
    const select = postSelect(user.id)
    const where = mediaWhere(user)
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
