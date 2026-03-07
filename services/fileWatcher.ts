import chokidar from "chokidar"
import debounce from "lodash.debounce"
import { mediaQueue } from "@/lib/mediaQueue"

export function startFileWatcher() {

    const watcher = chokidar.watch("./uploads", {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 2000,
            pollInterval: 100
        }
    })

    const queueFile = debounce(async (filePath: string) => {

        console.log("📦 Queueing media job:", filePath)

        await mediaQueue.add("process-media", {
        path: filePath
        })
        // await mediaQueue.add(
        // "process-media",
        // { path: filePath },
        // {
        //     jobId: filePath
        // }
        // )
    }, 1000)

    watcher.on("add", queueFile)
    watcher.on("change", queueFile)

    return watcher
}