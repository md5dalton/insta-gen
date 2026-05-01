import { NextRequest, NextResponse } from "next/server"
import { resolveUserFromRequest } from "@/lib/auth"

type User = {
    id: string
}

type RouteContext<TParams = any> = {
    params: Promise<TParams> | TParams
}

type AuthedHandler<TParams = any> = (
    req: NextRequest,
    ctx: { params: TParams; user: User }
) => Promise<Response>

export function withAuth<TParams = any>(handler: AuthedHandler<TParams>) {
    return async (
        req: NextRequest,
        ctx: RouteContext<TParams>
    ): Promise<Response> => {
        try {
            const user = await resolveUserFromRequest(req)

            const params = await ctx.params

            return handler(req, {
                params,
                user
            })
        } catch (err: any) {
            return NextResponse.json(
                { error: err?.message || "Unauthorized" },
                { status: 401 }
            )
        }
    }
}