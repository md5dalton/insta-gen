import { workerLoop } from "./mediaWorker"

const WORKER_CONCURRENCY = 1

// 🔥 run multiple workers in same process
for (let i = 0; i < WORKER_CONCURRENCY; i++) {
    workerLoop()
}

process.on("SIGINT", () => {
    console.log("🛑 Worker stopped")
    process.exit(0)
})

process.on("SIGTERM", () => {
    console.log("🛑 Worker stopped")
    process.exit(0)
})