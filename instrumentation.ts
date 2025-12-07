// import { mediaProcessorInstance } from "./services/media.processor"
import { initializeServices } from "./services/services"

export async function register(): Promise<void> {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        console.log("🚀 Initializing media processor via instrumentation...")

        initializeServices()
        // try {
        
        //     console.log("✅ Media processor initialized via instrumentation")
            
        //     // Handle graceful shutdown
        //     process.on("SIGTERM", async () => {
        //         console.log("🛑 Received SIGTERM, shutting down media processor...")

        //         if (global.mediaProcessor) await global.mediaProcessor.dispose()
                
        //         process.exit(0)
        //     })

        //     process.on("SIGINT", async () => {
        //         console.log("🛑 Received SIGINT, shutting down media processor...")
        //         if (global.mediaProcessor) await global.mediaProcessor.dispose()
                    
        //         process.exit(0)
        //     })
        
        // } catch (error) {
        //     console.error("❌ Failed to initialize media processor:", error)
        // }
    }
}