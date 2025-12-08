import prisma from "@/lib/prisma"
import { MediaType } from "@/types/type"

type Reel = {
    id: string
    isVideo: boolean
    owner: {
        id: string
        name: string
        picture: string | null
    }
}

const fromReel = (options: any) => ({
    where: {
        type: MediaType.VIDEO,
        ...options
    },
    select: {
        id: true,
        owner: {
            select: {
                id: true,
                name: true,
                picture: true,
            }
        }
    }
})

export const getReel = async (id: string): Promise<Reel | null> => await prisma.media.findUnique(fromReel({
    id
}))

export const getReels = async (user: string): Promise<Reel[]> => await prisma.media.findMany(fromReel({
    ownerId: user,
}))

export const getRelatedReels = async (reel: string): Promise<Reel[]> => await prisma.media.findManyRandom(10, fromReel({
    id: {
        not: reel
    }
}))