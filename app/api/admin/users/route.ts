import { NextResponse } from "next/server"
import { db } from "@/server/db"
import { authenticateRequest } from "@/server/auth"

export async function GET() {
    const users = await db.listProfileUsers()
    return NextResponse.json(users)
}

export async function POST(request: Request) {
    const admin = await authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { name, email, role, capability, avatarUrl } = await request.json()
    if (!name || !email)
        return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    const users = await db.listProfileUsers()
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (existing) return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    const created = await db.createProfileUser({ name, email: email.toLowerCase().trim(), role: role || "USER", capability: capability || "VIEW", picture: avatarUrl } as any)
    return NextResponse.json(created, { status: 201 })
}
