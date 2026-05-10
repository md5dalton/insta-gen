import { NextRequest, NextResponse } from "next/server"
import { resolveUserFromRequest } from "@/lib/auth"

type User = {
    id: string
}

type ParamsHandler<TParams extends Record<string, string>> = (
    req: NextRequest,
    ctx: {
        user: User
        params: TParams
    }
) => Promise<Response>

export default function withAuthParams<
    TParams extends Record<string, string>
>(
    handler: ParamsHandler<TParams>
){
    return async (
        req: NextRequest,
        ctx: {
            params: Promise<TParams>
        }
    ): Promise<Response> => {
        try {
            const user = await resolveUserFromRequest(req)

            const params = await ctx.params

            return handler(req, {
                user,
                params
            })
        } catch (err: any) {
            return NextResponse.json(
                { error: err?.message || "Unauthorized" },
                { status: 401 }
            )
        }
    }
}