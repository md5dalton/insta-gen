import prisma from "@/utils/prisma"

export const getPosts = async count =>  await prisma.post.findManyRandom(count, {
    select: {
        id: true,
        thumb: true,
        media: {
            select: {
                id: true
            }
        }
    }
})

export const getVideos = async count =>  await prisma.media.findManyRandom(count, {
    where: {
        isVideo: true
    },
    include: {
        id: true
    }
})