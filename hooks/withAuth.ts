import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

type AuthPayload = {
    userId: string
}

type RouteContext<TParams = any> = {
    params: TParams
}

type AuthedHandler<TParams = any> = (
    req: NextRequest,
    ctx: RouteContext<TParams> & { user: AuthPayload }
) => Promise<Response>

export function withAuth<TParams = any>(handler: AuthedHandler<TParams>) {
    return async (
        req: NextRequest,
        ctx: RouteContext<TParams>
    ): Promise<Response> => {
        const authHeader = req.headers.get("authorization")

        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const token = authHeader.split(" ")[1]

        try {
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET!
            ) as AuthPayload

            return handler(req, {
                ...ctx,
                user: decoded
            })
        } catch {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 })
        }
    }
}