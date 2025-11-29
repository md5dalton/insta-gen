import prisma from "@/utils/prisma"

type Media = {
    path: string
}

export type MediaResponse = {
    id: string
    isVideo: boolean
    owner: {
        id: string
        name: string
        picture: string | null
    }
}
export const getMedia = async (slug: string): Promise<Media | null> => await prisma.media.findUnique({
    where: { id: slug },
    select: { path: true }
})

export const getRandom = async (): Promise<MediaResponse[]> => await prisma.media.findManyRandom(20, {
    where: {
        isVideo: false
    },
    select: {
        id: true,
        isVideo: true,
        owner: {
            select: {
                id: true,
                name: true,
                picture: true
            }
        }
    }
})