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

            switch (payload.event) {
                case "add":
                    await mediaService.handleAdd(payload.path)
                    
                    break;

                case "delete":
                    await mediaService.handleDelete(payload.path)
                    break;
            
                default:
                    await markFailed(job)
                    break;
            }

            await markDone(job.id)


        } catch (err) {
            await markFailed(job)
        }
    }
}


const WORKER_CONCURRENCY = 1

// 🔥 run multiple workers in same process
for (let i = 0; i < WORKER_CONCURRENCY; i++) {
    workerLoop()
}

