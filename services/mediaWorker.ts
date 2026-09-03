import { MediaService } from "@/services/mediaService"
import prisma from "@/lib/prisma"
import { fetchAndLockJob } from "./fetchAndLockJob"
import { markDone, markFailed } from "./jobLifecycle"

const mediaService = new MediaService(prisma)

export async function workerLoop() {
    while (true) {
        const job = await fetchAndLockJob()

        if (!job) {
            await new Promise(r => setTimeout(r, 1000))
            continue
        }

        try {
            const payload = job.payload as any

            if (payload.event === "delete") {
                await mediaService.handleDelete(payload.id)
            } else {
                await mediaService.handleAddOrChange(
                    {
                        id: payload.id,
                        path: payload.path
                    },
                    payload.userId,
                    payload.tags
                )
            }

            await markDone(job.id)

        } catch (err) {
            await markFailed(job)
        }
    }
}
