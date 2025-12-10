import prisma from "@/lib/prisma"

export const getUser = async (id: string) => await prisma.user.findUnique({
    where: {
        id
    },
    select: {
        id: true,
        name: true,
        picture: true
    }
})

export const getPosts = async (user: string, page: number) => await prisma.post.findMany({
    where: {
        ownerId: user
    },
    skip: page * 10,
    take: 10,
    orderBy: {
        path: "desc"
    },
    select: {
        id: true,
        thumb: true,
        ownerId: true,
        media: {
            select: {
                type: true
            }
        }
    }
})

export const getReels = async (user, page) => await prisma.media.findMany({
    where: {
        ownerId: user,
        type: "VIDEO"
    },
    skip: page * 10,
    take: 10,
    orderBy: {
        path: "desc"
    }
})