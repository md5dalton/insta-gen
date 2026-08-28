import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { authenticateRequest } from "@/server/auth"
import { getSettingsRecord } from "@/app/api/admin/settings/route"

export async function POST(request: Request) {
    const admin = await authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const mediaRoot = typeof body.mediaRoot === "string" ? body.mediaRoot.trim() : typeof body.path === "string" ? body.path.trim() : ""

    if (!mediaRoot) {
        return NextResponse.json({ error: "Valid mediaRoot string is required" }, { status: 400 })
    }

    const existing = await prisma.systemSetting.findFirst({ where: { id: "singleton" } })
    const previous = existing?.mediaRoot || "/mnt/media/library"

    await prisma.systemSetting.upsert({
        where: { id: "singleton" },
        update: { mediaRoot },
        create: { id: "singleton", mediaRoot },
    })

    await prisma.activityLog.create({
        data: {
            type: "SETTINGS_UPDATE",
            title: "Media root changed",
            description: `Media root changed from ${previous} -> ${mediaRoot}`,
        },
    })

    const settings = await getSettingsRecord()

    return NextResponse.json({
        success: true,
        warning:
            "Changing the media root does not move existing media. The system will now scan this path.",
        settings,
        message: "Media root updated successfully.",
    })
}
