export function registerShutdown(handler: (signal: string) => Promise<void>) {
    const shutdown = async (signal: string) => {
        console.log(`🛑 ${signal} received, shutting down...`)
        await handler(signal)
        process.exit(0)
    }

    process.once("SIGTERM", shutdown)
    process.once("SIGINT", shutdown)
}