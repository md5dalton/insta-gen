import { NextResponse } from "next/server"
import { isMediaWatcherRunning } from "@/services/mediaWatcher"

export async function GET() {
    try {
        const running = isMediaWatcherRunning()
        return NextResponse.json({ running })
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
    }
}
