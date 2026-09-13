import { Job } from "@/prisma/generated/client"
import { MediaProcessor } from "@/lib/mediaProcessor"
import prisma from "../prisma"
import { markDone, markFailed } from "../job"

const mediaService = new MediaProcessor(prisma)

export const process = async (job: Job) => {

    const {
        event
    } = job

    const payload = job.payload as any

    try {
        switch (event) {
            case "ADD":
                await mediaService.handleAdd(payload.path)
                await markDone(job.id)
                break;

            case "DELETE":
                await mediaService.handleDelete(payload.path)
                await markDone(job.id)
                break;
            case "UPDATE":
                await mediaService.handleUpdate(payload.id)
                await markDone(job.id)
                break;
            default:
                await markFailed(job)
                break;
        }

    } catch (err) {
        await markFailed(job)
    }
}