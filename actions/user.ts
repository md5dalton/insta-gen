import prisma from "@/lib/prisma"
import { MediaType } from "@/prisma/generated/client"

type Cursor = {
    id: string
    createdAt: Date
}

export type Post = {
    id: string
    ownerId: string
    isVideo: boolean
}

export const getLike = async (
    userId: string,
    mediaId: string,
): Promise<Cursor | null> => await prisma.like.findUnique({
    where: {
        userId_mediaId: {
            userId,
            mediaId,
        },
    },
    select: {
        id: true,
        createdAt: true
    }
})
export const getSave = async (
    userId: string,
    mediaId: string,
): Promise<Cursor | null> => await prisma.save.findUnique({
    where: {
        userId_mediaId: {
            userId,
            mediaId,
        },
    },
    select: {
        id: true,
        createdAt: true
    }
})

export const getLikedPosts = async (
    userId: string,
    cursor?: Cursor,
    take: number = 10
): Promise<Post[]> => {
    const likes = await prisma.like.findMany({
        where: {
            userId,

            ...(cursor && {
                OR: [
                    {
                        createdAt: {
                            lt: cursor.createdAt,
                        },
                    },

                    {
                        createdAt: cursor.createdAt,

                        id: {
                            lt: cursor.id,
                        },
                    },
                ],
            }),
        },

        take,

        orderBy: [
            {
                createdAt: "desc",
            },

            {
                id: "desc",
            },
        ],

        select: {
            media: {
                select: {
                    id: true,
                    type: true,
                    owner: {
                        select: {
                            id: true,
                        },
                    },
                },
            },
        },
    })

    return likes.map(({ media }) => ({
        id: media.id,
        ownerId: media.owner.id,
        isVideo: media.type === MediaType.VIDEO
    }))
}
export const getSavedPosts = async (
    userId: string,
    cursor?: Cursor,
    take: number = 10
): Promise<Post[]> => {
    const saves = await prisma.save.findMany({
        where: {
            userId,

            ...(cursor && {
                OR: [
                    {
                        createdAt: {
                            lt: cursor.createdAt,
                        },
                    },

                    {
                        createdAt: cursor.createdAt,

                        id: {
                            lt: cursor.id,
                        },
                    },
                ],
            }),
        },

        take,

        orderBy: [
            {
                createdAt: "desc",
            },

            {
                id: "desc",
            },
        ],

        select: {
            media: {
                select: {
                    id: true,
                    type: true,
                    owner: {
                        select: {
                            id: true,
                        },
                    },
                },
            },
        },
    })

    return saves.map(({ media }) => ({
        id: media.id,
        ownerId: media.owner.id,
        isVideo: media.type === MediaType.VIDEO
    }))
}