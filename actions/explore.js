import prisma from "@/utils/prisma"

export const getReel = async id => await prisma.reel.findUnique({
    where: {
        id
    },
    select: {
        id: true,
        owner: {
            select: {
                id: true,
                name: true,
                picture: true,
            }
        }
    }
})

export const getReels = async user => await prisma.reel.findMany({
    where: {
        ownerId: user
    },
    select: {
        id: true,
        owner: {
            select: {
                id: true,
                name: true,
                picture: true,
            }
        }
    }
})