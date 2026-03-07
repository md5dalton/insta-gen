import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    if (
        pathname.startsWith("/api/reel") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/sync") ||
        pathname.startsWith("/api/media")
    ) return NextResponse.next()

    // Only protect API routes
    if (pathname.startsWith("/api")) {
        const authHeader = request.headers.get("authorization")

        if (!authHeader || !authHeader.startsWith("Bearer ")) return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        )

        const token = authHeader.split(" ")[1]

        try {
            jwt.verify(token, process.env.JWT_SECRET!)
            return NextResponse.next()
        } catch (err) {
            return NextResponse.json(
                { error: "Invalid token" },
                { status: 401 }
            )
        }
    }

    return NextResponse.next()
}