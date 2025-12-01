import { DebouncedMediaProcessor } from "./services/media.processor"
import { existsSync, mkdirSync } from "fs"
import { MEDIA_ROOT } from "./lib/constants"
export const runtime = "nodejs"

export async function register(): Promise<void> {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        console.log("🚀 Initializing media processor via instrumentation...")

        try {
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