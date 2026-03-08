import DebouncedMediaProcessor from "../services/scanner.service"

export let mediaProcessor: DebouncedMediaProcessor | null = null

export async function startMediaProcessor() {
    if (mediaProcessor) return

    mediaProcessor = new DebouncedMediaProcessor()
    await mediaProcessor.initialize()

    console.log("✅ Media processor started")
}

export async function stopMediaProcessor() {
    if (!mediaProcessor) return

    await mediaProcessor.dispose()
    mediaProcessor = null

    console.log("🛑 Media processor stopped")
}