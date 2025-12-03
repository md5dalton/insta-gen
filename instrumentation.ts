import { DebouncedMediaProcessor } from "./services/media.processor"

export async function register(): Promise<void> {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        console.log("🚀 Initializing media processor via instrumentation...")

        try {
            const fs = await import("fs")
            const os = await import("os")
            const path = await import("path")
            
            const MEDIA_ROOT = process.env.MEDIA_ROOT ?
                path.join(os.homedir(), process.env.MEDIA_ROOT) :
                path.join(process.cwd(), "media")

            if (!fs.existsSync(MEDIA_ROOT)) fs.mkdirSync(MEDIA_ROOT, { recursive: true })
        
            global.mediaProcessor = new DebouncedMediaProcessor(MEDIA_ROOT)
            await global.mediaProcessor.initialize()
            
            console.log("✅ Media processor initialized via instrumentation")
            
            // Handle graceful shutdown
            process.on("SIGTERM", async () => {
                console.log("🛑 Received SIGTERM, shutting down media processor...")

                if (global.mediaProcessor) await global.mediaProcessor.dispose()
                
                process.exit(0)
            })

            process.on("SIGINT", async () => {
                console.log("🛑 Received SIGINT, shutting down media processor...")
                if (global.mediaProcessor) await global.mediaProcessor.dispose()
                    
                process.exit(0)
            })
        
        } catch (error) {
            console.error("❌ Failed to initialize media processor:", error)
        }
    }
}
export const runtime = "nodejs"