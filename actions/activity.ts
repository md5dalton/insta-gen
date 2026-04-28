import prisma from "@/lib/prisma"

export const likePost = async (userId: string, mediaId: string) => await prisma.like.upsert({
    where: { userId_mediaId: { userId, mediaId } },
    update: {},
    create: { userId, mediaId },
})
export const unLikePost = async (userId: string, mediaId: string) => await prisma.like.delete({
    where: { userId_mediaId: { userId, mediaId } }
})
