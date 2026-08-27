import { NextResponse } from "next/server"
import { generateToken, verifyPassword } from "@/server/auth"
import { db } from "@/server/db"

export async function POST(request: Request) {
    
    const body = await request.json().catch(() => ({}))

    if (!db.admin)
        return NextResponse.json(
            { error: "Administrator is not configured yet. Run setup first." },
            { status: 400 }
        )

    const { email, password } = body

    if (!email || !password)
        return NextResponse.json({ error: "Email and password are required." }, { status: 400 })
    
    const currentHash = db.adminPasswordHash || ""
    
    if (
        email.trim().toLowerCase() !== db.admin.email.toLowerCase() ||
        !verifyPassword(password, currentHash)
    )
        return NextResponse.json(
            { error: "Invalid administrator credentials." },
            { status: 401 }
        )

    const token = generateToken()
    db.tokens.add(token)

    return NextResponse.json({
        token,
        user: db.admin,
    })
}
