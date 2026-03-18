import { DebouncedMediaProcessor } from "@/services/scanner.service"
import { FSWatcher } from "chokidar"

declare global {
    var mediaProcessor: DebouncedMediaProcessor | null
    var fileWatcher: FSWatcher | null

    var syncState: {
        isInitialized: boolean
        isProcessing: boolean
        lastSync: Date | null
        stats: {
            processed: number
            errors: number
            queued: number

        }
    }
}

export {}