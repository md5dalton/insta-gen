import prisma from "@/utils/prisma"


export const getPost = async id => await prisma.post.findUnique({
    where: {
        id
    }
})

export const getPosts = async (user, page) => await prisma.post.findMany({
    where: {
        ownerId: user
    },
    select: {
        path: true,
        media: {
            select: {
                id: true,
                height: true,
                width: true,
                reel: {
                    select: {
                        id: true
                    }
                }
            }
        },
        owner: {
            select: {
                id: true,
                path: true,
                picture: true
            }
        }
    },
    skip: page * 10,
    take: 10,
    orderBy: {
        path: "desc"
    }
})