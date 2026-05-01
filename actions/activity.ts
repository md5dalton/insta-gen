import prisma from "@/lib/prisma"
import { Prisma } from "@/prisma/generated/client"

type ToggleDelegate = {
    create: (args: { data: { userId: string; mediaId: string } }) => Promise<any>
    delete: (args: { where: { userId_mediaId: { userId: string; mediaId: string } } }) => Promise<any>
}

export const toggleLike = (userId: string, mediaId: string) =>
    toggle(prisma.like, userId, mediaId)

export const toggleSave = (userId: string, mediaId: string) =>
    toggle(prisma.save, userId, mediaId)


const toggle = async (
    table: ToggleDelegate,
    userId: string,
    mediaId: string
): Promise<boolean> => {
    try {
        await table.create({
            data: { userId, mediaId },
        })

        return true
    } catch (error: unknown) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            await table.delete({
                where: {
                    userId_mediaId: { userId, mediaId },
                },
            })

            return false
        }

        throw error
    }
}