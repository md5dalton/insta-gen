import { NextResponse } from "next/server"
import { toggleMediaWatcher, isMediaWatcherRunning } from "@/services/mediaWatcher"

export async function POST() {
    try {
        const res = await toggleMediaWatcher()
        const running = isMediaWatcherRunning()
        return NextResponse.json({ success: true, watcherStatus: { running } })
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
    }
}
