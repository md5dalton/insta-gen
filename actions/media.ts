import prisma from "@/lib/prisma"
import { Media } from "@/prisma/generated/client"
import { MediaType } from "@/types/type"

type MediaProps = Pick<Media, "path" | "size" | "bitrate">

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
export const getMedia = async (slug: string): Promise<MediaProps | null> => await prisma.media.findUnique({
    where: { id: slug },
    select: {
        path: true,
        size: true,
        bitrate: true
    }
})

export const getRandom = async (
  limit: number = 10
): Promise<MediaResponse[]> => {
    
    const count = await prisma.media.count()
    const offset = Math.floor(Math.random() * count)
    
    return await prisma.$queryRaw`
        SELECT 
            m.id,
            m.type,
            m.height,
            m.width,
            m.duration,

            json_build_object(
                'id', u.id,
                'name', u.name,
                'picture', u.picture
            ) as owner,

            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object(
                        'id', t.id,
                        'name', t.name
                    )
                ) FILTER (WHERE t.id IS NOT NULL),
                '[]'
            ) as tags

        FROM "Media" m
        JOIN "User" u ON u.id = m."ownerId"

        LEFT JOIN "MediaTag" mt ON mt."mediaId" = m.id
        LEFT JOIN "Tag" t ON t.id = mt."tagId"

        GROUP BY m.id, u.id

        OFFSET ${offset}
        LIMIT ${limit}
    `
}