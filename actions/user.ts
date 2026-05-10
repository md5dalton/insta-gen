import prisma from "@/lib/prisma"
import { MediaType } from "@/prisma/generated/client"

type RecentlyLikedCursor = {
    id: string
    createdAt: Date
}

export type LikedPost = {
    id: string
    ownerId: string
    isVideo: boolean
}

export const getLike = async (
    userId: string,
    mediaId: string,
): Promise<RecentlyLikedCursor | null> => await prisma.like.findUnique({
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
    cursor?: RecentlyLikedCursor,
    take: number = 10
): Promise<LikedPost[]> => {
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