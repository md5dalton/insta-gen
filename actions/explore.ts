import prisma from "@/lib/prisma"
import { MediaType } from "@/types/type"

export type MediaResponse = {
    id: string
    type: MediaType
}

export const getRandom = async (count: number, type: MediaType): Promise<MediaResponse[]> => await prisma.$queryRaw`
    SELECT 
        m.id,
        m.type
    FROM "Media" m
    WHERE m.type = ${type}
    ORDER BY RANDOM()
    LIMIT ${count}
`