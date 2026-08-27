import { NextResponse } from "next/server"
import { hashPassword, generateToken } from "@/server/auth"
import { db } from "@/server/db"

export async function POST(request: Request) {
    
    const body = await request.json().catch(() => ({}))

    if (db.admin !== null) return NextResponse.json(
        { error: "System is already configured with an administrator." },
        { status: 400 }
    )

    const { name, email, password } = body
    
    if (!email || !password || password.length < 8) return NextResponse.json(
        { error: "Valid email and a password of at least 8 characters are required." },
        { status: 400 }
    )

    const newAdmin = {
        id: `admin-${Date.now()}`,
        name: name || "Primary Administrator",
        email: email.trim().toLowerCase(),
        createdAt: new Date().toISOString(),
    }

    db.admin = newAdmin
    db.adminPasswordHash = hashPassword(password)

    const token = generateToken()
    
    db.tokens.add(token)

    db.recentActivity.unshift({
        id: `act-${Date.now()}`,
        type: "POLICY_CHANGE",
        title: "Initial Administrator setup completed",
        description: `Admin account registered for ${newAdmin.email}`,
        timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
        { token, admin: { id: newAdmin.id, email: newAdmin.email, name: newAdmin.name } },
        { status: 201 }
    )
}
