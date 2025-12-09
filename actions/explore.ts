import prisma from "@/lib/prisma"
import { MediaType } from "@/types/type"

export type MediaResponse = {
    id: string
    type: MediaType
}

export const getRandom = async (count: number, type: MediaType): Promise<MediaResponse[]> => await prisma.media.findManyRandom(count, {
    where: {
        type
    },
    select: {
        id: true,
        type: true
    }
})