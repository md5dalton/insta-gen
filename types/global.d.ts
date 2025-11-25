import { DebouncedMediaProcessor } from "@/services/media.processor"

declare global {
    namespace NodeJS {
        interface Global {
            mediaProcessor: DebouncedMediaProcessor | null
            syncState: {
                isInitialized: boolean
                isProcessing: boolean
                lastSync: Date | null
                stats: {
                    processed: number
                    errors: number
                }
            }
        }
    }
}

export {}