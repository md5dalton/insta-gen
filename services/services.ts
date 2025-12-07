import { mediaProcessorInstance } from "./scanner.service"

// This is a workaround to ensure the scanner runs only once in dev mode with hot-reloading
declare global {
    var servicesInitialized: boolean
}

export const initializeServices = async () => {
    if (process.env.NODE_ENV === "development") {
        if (global.servicesInitialized) return
        
        global.servicesInitialized = true
    }
  
    global.mediaProcessor = mediaProcessorInstance
    await global.mediaProcessor.initialize()
            
}