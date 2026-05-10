import { NextRequest, NextResponse } from "next/server"
import { resolveUserFromRequest } from "@/lib/auth"

type User = {
    id: string
}

type Handler = (
    req: NextRequest,
    ctx: { user: User }
) => Promise<Response>

export default function withAuth (handler: Handler) {
    return async (req: NextRequest): Promise<Response> => {
        try {
            const user = await resolveUserFromRequest(req)

            return handler(req, { user })
        } catch (err: any) {
            return NextResponse.json(
                { error: err?.message || "Unauthorized" },
                { status: 401 }
            )
        }
    }
}