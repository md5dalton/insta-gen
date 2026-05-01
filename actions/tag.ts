import prisma from "@/lib/prisma"
import { Tag } from "@/prisma/generated/client"
import { mapPost, Post, postSelect } from "./post"

export const getTag = async (id: string): Promise<Tag | null> => await prisma.tag.findUnique({
    where: { id }
})

export const getCursor = async (id: string): Promise<{ id: string, mktime: string } | null> => await prisma.media.findUnique({
    where: { id },
    select: {
        id: true,
        mktime: true
    }
})

export const getTagPosts = async (
    userId: string,
    tagId: string,
    cursor?: { mktime: string; id: string },
    count: number = 10
): Promise<Post[] | null> => {
    const posts = await prisma.media.findMany({
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
            skip: 1,
        }),
        take: count,
        select: postSelect(userId)
    })

    return posts.map(post => mapPost(post))
}
