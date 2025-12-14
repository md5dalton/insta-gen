import prisma from "@/lib/prisma"
import { MediaType } from "@/types/type"

type Post = {
    id: string
}

export const getUser = async (id: string) => await prisma.user.findUnique({
    where: { id },
    select: {
        id: true,
        name: true,
        picture: true,
        _count: {
            select: {
                media: true
            }
        }
    }
})

export const getUserStats = async (id: string) => await prisma.media.groupBy({
    by: ["type"],
    where: { ownerId: id },
    _count: { _all: true }
})


export const getPosts = async (id: string, type: MediaType, count: number, skip: number): Promise<Post[]> => await prisma.media.findMany({
    where: {
        ownerId: id,
        type
    },
    skip,
    take: count,
    orderBy: {
        createdAt: "asc",
    },
    select: {
        id: true,
    }
})