import { NextResponse } from "next/server"
import { hashPassword, generateToken } from "@/server/auth"
import { db } from "@/server/db"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
    
    const body = await request.json().catch(() => ({}))

    const { name, email, password } = body
    
    if (!email || !password || password.length < 8) return NextResponse.json(
        { error: "Valid email and a password of at least 8 characters are required." },
        { status: 400 }
    )

    const existing = await prisma.adminUser.findFirst()
    
    const count = await db.adminCount()
    if (count > 0) return NextResponse.json(
        { error: "System is already configured with an administrator." },
        { status: 400 }
    )

    const created = await db.createAdmin({ name: name || "Primary Administrator", email: email.trim().toLowerCase(), passwordHash: hashPassword(password) })

    const token = generateToken()
    await db.createSession(token, created.id)

    return NextResponse.json(
        { token, admin: { id: created.id, email: created.email, name: created.name } },
        { status: 201 }
    )
}
