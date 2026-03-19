import DebouncedMediaProcessor from "./DebouncedMediaProcessor"

let processor: DebouncedMediaProcessor | null = null

export async function startMediaWatcher() {
    if (processor) return

    processor = new DebouncedMediaProcessor()
    await processor.initialize()

    console.log("👀 Media watcher started")
}

// graceful shutdown
export async function stopMediaWatcher() {
    if (processor) {
        await processor.dispose()
        processor = null
    }
}