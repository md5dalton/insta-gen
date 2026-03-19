import { MediaService } from "@/services/mediaService"
import { fetchAndLockJob } from "./fetchAndLockJob"
import { markDone, markFailed } from "./jobLifecycle"
import prisma from "@/lib/prisma"

const mediaService = new MediaService(prisma)

const WORKER_CONCURRENCY = 3

async function workerLoop() {
    while (true) {
        const job = await fetchAndLockJob()

        if (!job) {
            await new Promise(r => setTimeout(r, 1000))
            continue
        }

        try {
            const payload = job.payload as any

            if (payload.event === "delete") {
                await mediaService.handleDelete(payload.filePath)
            } else {
                await mediaService.handleAddOrChange(
                    payload.filePath,
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

// 🔥 run multiple workers in same process
// for (let i = 0; i < WORKER_CONCURRENCY; i++) {
    workerLoop()
// }