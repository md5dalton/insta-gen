import { NextResponse } from "next/server"

export async function GET(): Promise<NextResponse> {
    if (!global.syncState) {
        return NextResponse.json({ 
            error: "Media processor not initialized" 
        }, { status: 503 })
    }

    return NextResponse.json({
        ...global.syncState,
        pendingUpdates: global.mediaProcessor ? (global.mediaProcessor as any).pendingUpdates.size : 0,
        isProcessing: global.mediaProcessor ? (global.mediaProcessor as any).isProcessing : false
    })
    }

export async function POST(): Promise<NextResponse> {
    if (global.mediaProcessor) {
        (global.mediaProcessor as any).processThrottled()
        return NextResponse.json({ message: "Sync triggered" })
    }
    
    return NextResponse.json({ error: "Media processor not initialized" }, { status: 500 })
}