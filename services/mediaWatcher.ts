import prisma from "@/lib/prisma"
import Watcher from "./Watcher"
import { MediaConfig } from "@/lib/config"

let watcher: Watcher | null = null

export async function startMediaWatcher() {
    if (watcher) return

    const setting = await prisma.systemSetting.findFirst({
        where: { id: "singleton" },
    })

    if (!setting?.mediaRoot) return

    watcher = new Watcher(setting.mediaRoot, [
        ...MediaConfig.IMAGE_EXTENSIONS,
        ...MediaConfig.VIDEO_EXTENSIONS
    ])

    await watcher.initialize()

    console.log(`👀 Media watcher started at ${setting.mediaRoot}`)
}

// graceful shutdown
export async function stopMediaWatcher() {
    if (watcher) {
        await watcher.dispose()
        watcher = null
    }
}

export function isMediaWatcherRunning() {
    return !!watcher
}

export async function triggerManualScan() {
    if (!watcher) return false
    try {
        // call initialScan (now public) to perform manual discovery
        // @ts-ignore
        await watcher.initialScan()
        return true
    } catch (e) {
        console.error("Manual scan failed", e)
        return false
    }
}

export async function toggleMediaWatcher() {
    if (watcher) {
        await stopMediaWatcher()
        return { running: false }
    }

    await startMediaWatcher()
    return { running: !!watcher }
}
