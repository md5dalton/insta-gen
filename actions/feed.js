import prisma from "@/utils/prisma"

export const getPosts = async () => {

    return await prisma.post.findManyRandom(10, {
        select: {
            media: {
                select: {
                    id: true,
                    type: true
                }
            },
            owner: {
                select: {
                    id: true,
                    path: true,
                    picture: true
                }
            }
        }
    })

}