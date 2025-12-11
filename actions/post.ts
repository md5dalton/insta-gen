import prisma from "@/lib/prisma"
import { MediaType } from "@/types/type"

export type Post = {
    id: string
    type: MediaType
    height: number,
    width: number,
    owner: {
        id: string
        name: string
        picture: string | null
    }
}

const fromPost = (options: any) => ({
    where: {
        type: MediaType.IMAGE,
        ...options
    },
    select: {
        id: true,
        type: true,
        height: true,
        width: true,
        owner: {
            select: {
                id: true,
                name: true,
                picture: true,
            }
        }
    }
})

export const getPost = async (id: string): Promise<Post | null> => await prisma.media.findUnique(fromPost({
    id
}))

export const getUserPosts = async (userId: string, postId: string, count: number, skip: number): Promise<Post[]> => await prisma.media.findMany({
    ...fromPost({ ownerId: userId }),
    cursor: {
        id: postId,
    },
    skip,
    take: count,
    orderBy: {
        createdAt: "asc",
    }
})