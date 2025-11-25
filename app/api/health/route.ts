import { NextResponse } from "next/server"

interface HealthResponse {
    status: string
    uptime: number
    timestamp: string
    isInitialized: boolean
    lastSync: string | null
    stats: {
        processed: number
        errors: number
    }
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
    const health: HealthResponse = {
        status: global.syncState?.isInitialized ? "healthy" : "initializing",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        isInitialized: global.syncState?.isInitialized || false,
        lastSync: global.syncState?.lastSync?.toISOString() || null,
        stats: global.syncState?.stats || { processed: 0, errors: 0 }
    }
    
    return NextResponse.json(health)
}