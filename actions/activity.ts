import prisma from "@/lib/prisma"
import { Prisma } from "@/prisma/generated/client"

export const toggleLike = (userId: string, mediaId: string) => toggle("like", userId, mediaId)

export const toggleSave = (userId: string, mediaId: string) => toggle("save", userId, mediaId)

const toggle = async (
    type: "like" | "save",
    userId: string,
    mediaId: string
): Promise<boolean> => {
    try {
        await prisma.$transaction(async (tx) => {
            if (type === "like") {
                await tx.like.create({ data: { userId, mediaId } })
                await tx.mediaItem.update({
                    where: { id: mediaId },
                    data: { likesCount: { increment: 1 } },
                })
            } else {
                await tx.save.create({ data: { userId, mediaId } })
                await tx.mediaItem.update({
                    where: { id: mediaId },
                    data: { savesCount: { increment: 1 } },
                })
            }
        })

        return true
    } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            await prisma.$transaction(async (tx) => {
                if (type === "like") {
                    const { count } = await tx.like.deleteMany({ where: { userId, mediaId } })
                    if (count) {
                        await tx.mediaItem.update({
                            where: { id: mediaId },
                            data: { likesCount: { decrement: 1 } },
                        })
                    }
                } else {
                    const { count } = await tx.save.deleteMany({ where: { userId, mediaId } })
                    if (count) {
                        await tx.mediaItem.update({
                            where: { id: mediaId },
                            data: { savesCount: { decrement: 1 } },
                        })
                    }
                }
            })

            return false
        }

        throw error
    }
}
