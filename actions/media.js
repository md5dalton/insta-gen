import prisma from "@/utils/prisma"

export const getMedia = async slug => await prisma.media.findUnique({
    where: {
        id: slug
    },
    select: {
        path: true
    }
})