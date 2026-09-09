import prisma from "@/lib/prisma"

export const exists = async (id: string): Promise<boolean> => {
    const count = await prisma.mediaItem.count({ where: { id } })

    return count ? true : false
}
