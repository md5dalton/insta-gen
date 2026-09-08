import prisma from "@/lib/prisma"
import { AssetType } from "@/prisma/generated/enums"
import { ProcessingProfile } from "@/types/types"


export const list = async (): Promise<ProcessingProfile[]> => {
    return await prisma.processingProfile.findMany({
        select: {
            id: true,
            name: true,
            description: true,
            renditions: true,
        }
    })
}

export const create = async (name: string, description: string, renditions: AssetType[]): Promise<ProcessingProfile> => {
    return await prisma.processingProfile.create({
        data: {
            name,
            description,
            renditions
        }
    })
}