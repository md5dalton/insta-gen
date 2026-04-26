import prisma from "@/lib/prisma"
import { MediaType } from "@/prisma/generated/enums"

export type MediaResponse = {
    id: string
    ownerId: string
    type: MediaType
}

export const getRandom = async (count: number, type: MediaType): Promise<MediaResponse[]> => {
    const r = Math.random()
    
    return await prisma.$queryRaw`
        SELECT 
            m.id,
            m.type,
            m."ownerId"
        FROM "Media" m
        WHERE m.type = ${type}
        ORDER BY 
            (m.random < ${r}),
            m.random
        LIMIT ${count}
    `
}