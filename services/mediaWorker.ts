import { fetchAndLockJob } from "./fetchAndLockJob"
import { markDone, markFailed } from "./jobLifecycle"
import { process as processMedia } from "@/lib/worker/media"
import { process as processParent} from "@/lib/worker/mediaParent"

export async function workerLoop() {
    while (true) {
        const job = await fetchAndLockJob()

        if (!job) {
            await new Promise(r => setTimeout(r, 1000))
            continue
        }

        try {
            switch (job.type) {
                case "MEDIA":
                    await processMedia(job)
                    break;

                case "ROOT_COLLECTION":
                case "COLLECTION":
                case "USER":
                case "TAG":
                    await processParent(job)
                    break;
            
                default:
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


// const jobs = await prisma.job.count()
// console.log(jobs)