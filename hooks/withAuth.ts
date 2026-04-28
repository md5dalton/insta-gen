import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

type AuthPayload = {
    userId: string
}

type AuthedHandler = (
    req: NextRequest,
    ctx: { user: AuthPayload }
) => Promise<Response>

export const withAuth = (handler: AuthedHandler) => async (req: NextRequest): Promise<Response> => {
    const authHeader = req.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET!
        ) as AuthPayload

        return handler(req, { user: decoded })
    } catch {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
}