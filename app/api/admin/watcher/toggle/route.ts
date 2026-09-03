import { NextResponse } from "next/server"
import { toggleMediaWatcher, isMediaWatcherRunning } from "@/services/mediaWatcher"
import { authenticateRequest } from "@/server/auth"

export async function POST(request: Request) {
    try {
        const admin = await authenticateRequest(request.headers.get("authorization") || undefined)
        if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const res = await toggleMediaWatcher()
        const running = isMediaWatcherRunning()
        return NextResponse.json({ success: true, watcherStatus: { running } })
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
    }
}
