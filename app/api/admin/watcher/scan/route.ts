import { NextResponse } from "next/server"
import { triggerManualScan } from "@/services/mediaWatcher"

export async function POST() {
    try {
        const ok = await triggerManualScan()
        return NextResponse.json({ success: ok })
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
    }
}
