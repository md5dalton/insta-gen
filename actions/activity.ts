import prisma from "@/lib/prisma"

export const likePost = async (userId: string, mediaId: string) => await prisma.like.upsert({
    where: { userId_mediaId: { userId, mediaId } },
    update: {},
    create: { userId, mediaId },
})
export const unLikePost = async (userId: string, mediaId: string) => await prisma.like.delete({
    where: { userId_mediaId: { userId, mediaId } }
})
export async function toggleLike(userId: string, mediaId: string) {
    try {
        // Try to create (like)
        await prisma.like.create({
            data: { userId, mediaId },
        })

        return true
    } catch (error: any) {
        // If it already exists → unlike
        if (error.code === "P2002") {
            await prisma.like.delete({
                where: {
                    userId_mediaId: { userId, mediaId },
                },
            })

            return false
        }

        throw error
    }
}
