import { NextResponse } from "next/server"
import { db } from "@/server/db"

export async function POST(request: Request) {

    const authHeader = request.headers.get("authorization")

    if (authHeader) {
        const token = authHeader.replace(/^Bearer\s+/i, "").trim()
        db.tokens.delete(token)
    }
    
    return NextResponse.json({ success: true, message: "Logged out successfully" })
}
