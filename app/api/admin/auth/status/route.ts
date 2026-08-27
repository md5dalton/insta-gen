import { NextResponse } from "next/server"
import { authenticateRequest } from "@/server/auth"
import { db } from "@/server/db"

export async function GET(request: Request) {
    // status
    const isConfigured = db.admin !== null
    const user = authenticateRequest(request.headers.get("authorization") || undefined)

    return NextResponse.json({
        isConfigured,
        isAuthenticated: user !== null,
        user,
    })
}