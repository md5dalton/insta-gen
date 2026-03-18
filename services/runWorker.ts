import "../workers/mediaWorker.ts"

process.on("SIGINT", () => {
    console.log("🛑 Worker stopped")
    process.exit(0)
})

process.on("SIGTERM", () => {
    console.log("🛑 Worker stopped")
    process.exit(0)
})