import prisma from "@/lib/prisma"
import { Media, Tag, User } from "@/prisma/generated/client"

export type TagMedia = Pick<Media, "id" | "type" | "height" | "width"> & {
    owner:  Pick<User, "id" | "name" | "picture">
}

type PostMedia = Pick<Media, "id" | "mktime">

export const getTag = async (id: string): Promise<Tag | null> => await prisma.tag.findUnique({
    where: { id }
})

export const getMedia = async (id: string): Promise<PostMedia | null> => await prisma.media.findUnique({
    where: { id },
    select: {
        id: true,
        mktime: true
    }
})

export const getTagPosts = async (
    tagId: string,
    count: number = 10,
    page: number = 0,
    cursor?: { mktime: string; id: string }
): Promise<TagMedia[] | null> => await prisma.media.findMany({
    where: {
        tags: {
            some: {
                tagId,
            },
        },
    },
    orderBy: [
        { mktime: "desc" },
        { id: "desc" }, // tie-breaker
    ],
    ...(cursor && {
        cursor: {
            mktime_id: cursor, // requires composite unique/index
        },
        skip: page === 0 ? 0 : 1,
    }),
    take: count,
    select: {
        id: true,
        type: true,
        height: true,
        width: true,
        mktime: true,
        owner: {
            select: {
                id: true,
                name: true,
                picture: true,
            },
        },
    },
})