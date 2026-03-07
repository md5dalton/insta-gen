import { Worker } from "bullmq"
import IORedis from "ioredis"

const connection = new IORedis({
    maxRetriesPerRequest: 2
})

new Worker(
    "media-processing",
    async (job) => {

        const { fileId, path } = job.data

        console.log("Processing media:", fileId)

        // await processMedia(path)

    },
    { connection: connection as any }
)