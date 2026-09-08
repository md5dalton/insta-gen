
import prisma from "@/lib/prisma"
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
