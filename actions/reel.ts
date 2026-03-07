import prisma from "@/lib/prisma"
import { MediaType } from "@/types/type"
import { Media, User } from "@/prisma/generated/client"

type Owner = Pick<User, "id" | "name" | "picture">
type Reel = Pick<Media, "id"> & {
    owner: Owner
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

export const getUserReels = async (user: string, cursor: string, skip: number, count: number): Promise<Reel[]> => await prisma.media.findMany({
    take: count,
    skip,
    cursor: {
        id: cursor
    },
    orderBy: {
        createdAt: "asc",
    },
    ...fromReel({
        ownerId: user,
    })
})

export const getRandomReels = async (limit: number = 10): Promise<Reel[]> => await prisma.$queryRaw`
    SELECT 
        m.id,
        json_build_object(
            'id', u.id,
            'name', u.name,
            'picture', u.picture
        ) as owner
    FROM "Media" m
    JOIN "User" u ON u.id = m."ownerId"
    WHERE m.type = ${MediaType.VIDEO}::"MediaType"
    ORDER BY RANDOM()
    LIMIT ${limit}
`

export const getReels = async (user: string): Promise<Reel[]> => await prisma.media.findMany(fromReel({
    ownerId: user,
}))