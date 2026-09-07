import { Job } from "@/prisma/generated/client"
import { markDone, markFailed } from "@/services/jobLifecycle"
import prisma from "../prisma"

export const process = async (job: Job) => {

    const {
        type,
        id
    } = job

    try {
        let where: any = {}

        if (type === "ROOT_COLLECTION") where = { user: { collection: { rootCollectionId: id } } }
        else if (type === "COLLECTION") where = { user: { collectionId: id } }
        else if (type === "USER") where = { userId: id }

        const medias = await prisma.mediaItem.findMany({ where, select: { id: true } })

        for (const m of medias) {
            try {
                const dedupeKey = `update:${m.id}`
                await prisma.job.create({ data: { type: "MEDIA", event: "UPDATE", payload: { id: m.id }, dedupeKey } })
            } catch (e) {
                // ignore duplicates
            }
        }
        await markDone(job.id)
    } catch (e) {
        await markFailed(job)
    }
}