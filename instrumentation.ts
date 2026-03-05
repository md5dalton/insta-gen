import DebouncedMediaProcessor from "./services/scanner.service"
import { getMediaRoot } from "./config/media"

export async function register(): Promise<void> {

    // if (process.env.NEXT_RUNTIME === "nodejs") {
    //     console.log("🚀 Initializing media processor via instrumentation...")

    //     global.mediaProcessor = new DebouncedMediaProcessor(getMediaRoot())

    //     try {
            
    //         await global.mediaProcessor.initialize()
        
    //         console.log("✅ Media processor initialized via instrumentation")
            
    //         // Handle graceful shutdown
    //         process.on("SIGTERM", async () => {
    //             console.log("🛑 Received SIGTERM, shutting down media processor...")

    //             if (global.mediaProcessor) await global.mediaProcessor.dispose()
                
    //             process.exit(0)
    //         })

    //         process.on("SIGINT", async () => {
    //             console.log("🛑 Received SIGINT, shutting down media processor...")
    //             if (global.mediaProcessor) await global.mediaProcessor.dispose()
                    
    //             process.exit(0)
    //         })
        
    //     } catch (error) {
    //         console.error("❌ Failed to initialize media processor:", error)
    //     }
    // }
}