import prisma from "@/utils/prisma"

export const getReel = async id => await prisma.media.findUnique({
    where: {
        id
    },
    select: {
        id: true,
        owner: {
            select: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        picture: true,
                    }
                }
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
export const getRelatedReels = async reel => await prisma.media.findManyRandom(10, {
    where: {
        isVideo: true,
        id: {
            not: reel
        }
    },
    select: {
        id: true,
        owner: {
            select: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        picture: true,
                    }
                }
            }
        }
    }
})