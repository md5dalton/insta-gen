import { NextResponse } from "next/server"
import { generateToken, verifyPassword } from "@/server/auth"
import { db } from "@/server/db"

export async function POST(request: Request) {
    
    const body = await request.json().catch(() => ({}))

    const { email, password } = body

    if (!email || !password)
        return NextResponse.json({ error: "Email and password are required." }, { status: 400 })

    const adminRecord = await db.findAdminByEmail(email.trim().toLowerCase())

    if (!adminRecord)
        return NextResponse.json(
            { error: "Invalid administrator credentials." },
            { status: 401 }
        )

    const currentHash = adminRecord.passwordHash || ""

    if (!verifyPassword(password, currentHash))
        return NextResponse.json(
            { error: "Invalid administrator credentials." },
            { status: 401 }
        )

    // create persisted session and mirror into in-memory tokens
    const token = generateToken()
    await db.createSession(token, adminRecord.id)

    return NextResponse.json({
        token,
        user: { id: adminRecord.id, email: adminRecord.email, name: adminRecord.name },
    })
}
