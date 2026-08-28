import { NextResponse } from "next/server"
import { authenticateRequest } from "@/server/auth"
import { getSettingsRecord } from "@/app/api/admin/settings/route"

export async function GET(request: Request) {
    const admin = await authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const settings = await getSettingsRecord()
    return NextResponse.json({ mediaRoot: settings.mediaRoot, status: settings.mediaRootStatus })
}
