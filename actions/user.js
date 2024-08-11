import prisma from "@/utils/prisma"

export const getUser = async user => await prisma.user.findUnique({
    where: {
        id: user
    },
    select: {
        id: true,
        name: true,
        picture: true,
        
        owner: {
            select: {
                id: true,
                name: true
            }
        },
        posts: {
            select: {
                id: true
            }
        }
    }
})

export const getPosts = async (user, page) => await prisma.post.findMany({
    where: {
        ownerId: user
    },
    skip: page * 10,
    take: 10,
    orderBy: {
        path: "desc"
    }
})

export const getReels = async (user, page) => await prisma.reel.findMany({
    where: {
        ownerId: user
    },
    skip: page * 10,
    take: 10,
    // orderBy: {
    //     path: "desc"
    // }
})