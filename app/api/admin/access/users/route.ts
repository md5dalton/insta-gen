import { NextResponse } from "next/server"
import { authenticateRequest } from "@/server/auth"

export async function GET(request: Request) {
    const admin = await authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // TODO: Implement endpoint
    return NextResponse.json([])
}
