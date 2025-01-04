import prisma from "@/utils/prisma"

export const getPosts = async () => {

    return await prisma.post.findManyRandom(10, {
        select: {
            media: {
                select: {
                    id: true,
                    isVideo: true
                }
            },
            owner: {
                select: {
                    id: true,
                    name: true,
                    picture: true
                }
            }
        }
    })

}