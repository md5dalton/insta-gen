import { NextRequest, NextResponse } from "next/server"
import { resolveUserFromRequest } from "@/lib/auth"

export const withAuth = (
    handler: (req: NextRequest, ctx: { user: { id: string } }) => Promise<Response>
) =>  async (req: NextRequest) => {
    try {
        const user = await resolveUserFromRequest(req)
        return handler(req, { user })
    } catch (err: any) {
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 401 }
        )
    }
}