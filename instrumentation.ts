import path from "path"
import { DebouncedMediaProcessor } from "./services/media.processor"
import { homedir } from "os"
import { existsSync, mkdirSync } from "fs"

export async function register(): Promise<void> {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        console.log("🚀 Initializing media processor via instrumentation...")
        
        const MEDIA_ROOT = process.env.MEDIA_ROOT
        
        const mediaLibraryPath = MEDIA_ROOT ? path.join(homedir(), MEDIA_ROOT) : path.join(process.cwd(), "media")
        
        if (!existsSync(mediaLibraryPath)) {

            console.log(`Creating media library directory at: ${mediaLibraryPath}`)

            mkdirSync(mediaLibraryPath, { recursive: true })
            
        }

        try {
            global.mediaProcessor = new DebouncedMediaProcessor(mediaLibraryPath)
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