import { Queue } from "bullmq"
import IORedis from "ioredis"

const connection = new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null
})

export const mediaQueue = new Queue("media-processing", {
    connection: connection as any
})