import { NextResponse } from "next/server"
import { db } from "@/server/db"
import { authenticateRequest } from "@/server/auth"

export async function GET(request: any, context: any) {
    const params =
        context?.params && typeof context.params.then === "function"
            ? await context.params
            : context?.params
    const admin = await authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await db.findProfileUserById(params.id)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    return NextResponse.json(user)
}

export async function PUT(request: any, context: any) {
    const params =
        context?.params && typeof context.params.then === "function"
            ? await context.params
            : context?.params
    const admin = await authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const existing = await db.findProfileUserById(params.id)
    if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 })
    const { name, role, capability } = await request.json()
    const updated = await db.updateProfileUser(params.id, { name, role, capability } as any)
    return NextResponse.json(updated)
}

export async function DELETE(request: any, context: any) {
    const params =
        context?.params && typeof context.params.then === "function"
            ? await context.params
            : context?.params
    const admin = await authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    try {
        const deleted = await db.deleteProfileUser(params.id)
        if (!deleted) return NextResponse.json({ error: "User not found" }, { status: 404 })
        return NextResponse.json({ success: true, deleted })
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || String(e) }, { status: 400 })
    }
}
