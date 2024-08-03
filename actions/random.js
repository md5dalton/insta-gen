import prisma from "@/utils/prisma"

export const getPosts = async count =>  await prisma.post.findManyRandom(count, {
    select: {
        id: true,
        thumb: true,
        media: {
            select: {
                type: true
            }
        }
    }
})

export const getVideos = async count =>  await prisma.media.findManyRandom(count, {
    where: {
        type: "VIDEO"
    },
    include: {
        id: true
    }
})