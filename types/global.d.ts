import { DebouncedMediaProcessor } from "@/services/scanner.service"

declare global {
    var mediaProcessor: DebouncedMediaProcessor | null

    var syncState: {
        isInitialized: boolean
        isProcessing: boolean
        lastSync: Date | null
        stats: {
            processed: number
            errors: number
        }
    }
}

export {}