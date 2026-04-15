import prisma from "@/lib/prisma"
import { Media, Tag, User } from "@/prisma/generated/client"
import { MediaType } from "@/types/type"

export const getUser = async (id: string): Promise<Pick<User, "id" | "name" | "picture"> | null> => await prisma.user.findUnique({
    where: { id },
    select: {
        id: true,
        name: true,
        picture: true,
    }
})

export const getUserStats = async (id: string) => await prisma.media.groupBy({
    by: ["type"],
    where: { ownerId: id },
    _count: { type: true }
})

export const getPosts = async (
    userId: string,
    mediaType: MediaType,
    cursorId?: string,
    take: number = 10
): Promise<Pick<Media, "id" | "ownerId">[]> => await prisma.media.findMany({
    where: {
        ownerId: userId,
        type: mediaType,
    },
    ...(cursorId && {
        cursor: { id: cursorId },
        skip: 1,
    }),
    take,
    orderBy: {
        createdAt: "asc",
    },
    select: {
        id: true,
        ownerId: true
    },
})

export const getTagCount = async (
    userId: string
): Promise<number> => await prisma.tag.count({
    where: {
        media: {
            some: {
                media: {
                    ownerId: userId,
                }
            }
        }
    }
})

export const getTags = async (
    userId: string,
    cursorId?: string,
    take: number = 10
): Promise<Pick<Tag, "id" | "name">[]> => await prisma.tag.findMany({
    where: {
        media: {
            some: {
                media: {
                    ownerId: userId,
                }
            }
        }
    },
    ...(cursorId && {
        cursor: { id: cursorId },
        skip: 1,
    }),
    take,
    orderBy: {
        name: "asc",
    },
    select: {
        id: true,
        name: true
    }
})