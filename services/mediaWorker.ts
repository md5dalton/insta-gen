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
                    await markDone(job.id)
                    break;

                case "delete":
                    await mediaService.handleDelete(payload.path)
                    await markDone(job.id)
                    break;
            
                default:
                    break;
            }



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


// const jobs = await prisma.job.count()
// console.log(jobs)