import { resolveEffectiveAccess } from "@/lib/policy/EffectiveAccess"
import { resolveEffectiveDeletion } from "@/lib/policy/EffectiveDeletion"
import { EffectiveProcessingMedia, resolveEffectiveProcessingPolicy } from "@/lib/policy/EffectiveProcessing"
import prisma from "@/lib/prisma"
import { MediaFilterParams, PaginatedResponse } from "@/types/types"
import { EffectiveMedia } from "../policy/EffectiveMedia"

export const getMedia = async (id: string): Promise<EffectiveMedia | null> => {

    const processingProfile = {
        select: {
            id: true,
            name: true,
            description: true,
            renditions: true
        }
    }

    const item = {
        id: true,
        path: true,
        deletedAt: true,
        visibility: true,
        processingProfile,
        allowedUsers: { select: { user: { select: { id: true, name: true, role: true } } } },
    }
    const rootCollection = {
        select: item
    }
    const collection = {
        select: {
            ...item,
            rootCollection 
        }
    }
    const user = {
        select: {
            ...item,
            collection
        }
    }
    const media = {
        ...item,
        type: true,
        assets: true,
        user
    }

    const mediaItem = await prisma.mediaItem.findUnique({
        where: { id },
        select: media
    })

    if (mediaItem) {
        return ({
            ...mediaItem,
            allowedUsers: mediaItem.allowedUsers.map(({ user }) => user),
            user: {
                ...mediaItem.user,
                allowedUsers: mediaItem.user.allowedUsers.map(({ user }) => user),
                collection: {
                    ...mediaItem.user.collection,
                    allowedUsers: mediaItem.user.collection.allowedUsers.map(({ user }) => user),
                    rootCollection: {
                        ...mediaItem.user.collection.rootCollection,
                        allowedUsers: mediaItem.user.collection.rootCollection.allowedUsers.map(({ user }) => user),
                    }
                }
            }
        })
    }
    
    return null
}
