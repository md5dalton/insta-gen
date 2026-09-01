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

export function isMediaWatcherRunning() {
    return !!processor
}

export async function triggerManualScan() {
    if (!processor) return false
    try {
        // call initialScan (now public) to perform manual discovery
        // @ts-ignore
        await processor.initialScan()
        return true
    } catch (e) {
        console.error("Manual scan failed", e)
        return false
    }
}

export async function toggleMediaWatcher() {
    if (processor) {
        await stopMediaWatcher()
        return { running: false }
    }

    await startMediaWatcher()
    return { running: !!processor }
}
