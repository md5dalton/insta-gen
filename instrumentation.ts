import DebouncedMediaProcessor from "./services/scanner.service"

export const runtime = "nodejs"

export async function register(): Promise<void> {
    if (process.env.NEXT_RUNTIME !== "nodejs") return

    console.log("🚀 Initializing media processor via instrumentation...")

    try {

        if (!global.mediaProcessor) {
            global.mediaProcessor = new DebouncedMediaProcessor()
            await global.mediaProcessor.initialize()

            console.log("✅ Media processor initialized via instrumentation")
        }

        const shutdown = async (signal: string) => {
            console.log(`🛑 Received ${signal}, shutting down media processor...`)

            if (global.mediaProcessor) {
                await global.mediaProcessor.dispose()
                global.mediaProcessor = undefined
            }

            process.exit(0)
        }

        process.on("SIGTERM", shutdown)
        process.on("SIGINT", shutdown)

    } catch (error) {
        console.error("❌ Failed to initialize media processor:", error)
    }
}

// import { startFileWatcher } from "./services/fileWatcher"

// export async function register2() {

//     if (process.env.NEXT_RUNTIME !== "nodejs") return

//     console.log("Starting file watcher")

//     global.fileWatcher = startFileWatcher()

// }