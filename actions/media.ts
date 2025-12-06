import prisma from "@/lib/prisma"
import { MediaType } from "@/types/type"

type Media = {
    path: string
}

export type MediaResponse = {
    id: string
    type: MediaType
    owner: {
        id: string
        name: string
        picture: string | null
    }
    width: number
    height: number
    duration: string | null
}
export const getMedia = async (slug: string): Promise<Media | null> => await prisma.media.findUnique({
    where: { id: slug },
    select: { path: true }
})

export const getRandom = async (): Promise<MediaResponse[]> => await prisma.media.findManyRandom(10, {
    // where: {
    //     type: MediaType.IMAGE
    // },
    select: {
        id: true,
        type: true,
        owner: {
            select: {
                id: true,
                name: true,
                picture: true
            }
        },
        height: true,
        width: true,
        duration: true,
    }
})