import { startMediaWatcher, stopMediaWatcher } from "./mediaWatcher"

async function main() {
    await startMediaWatcher()
}

main()

process.on("SIGINT", async () => {
    console.log("🛑 Shutting down watcher...")
    await stopMediaWatcher()
    process.exit(0)
})

process.on("SIGTERM", async () => {
    console.log("🛑 Shutting down watcher...")
    await stopMediaWatcher()
    process.exit(0)
})