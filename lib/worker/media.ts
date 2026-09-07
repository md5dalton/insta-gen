import { Job } from "@/prisma/generated/client"
import { markDone, markFailed } from "@/services/jobLifecycle"
import { MediaService } from "@/services/mediaService"
import prisma from "../prisma"

const mediaService = new MediaService(prisma)

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
                console.log(job)
                break;
            default:
                await markFailed(job)
                break;
        }

    } catch (err) {
        await markFailed(job)
    }
}