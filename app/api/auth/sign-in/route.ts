import { NextResponse } from "next/server"
import bcrypt from "bcrypt"
import prisma from "@/lib/prisma"
import jwt from "jsonwebtoken"

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json()
        
        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password required" },
                { status: 400 }
            )
        }
        
        const user = await prisma.profileUser.findUnique({
            where: { email },
        })
        
        if (!user) return NextResponse.json(
            { error: "Invalid credentials" },
            { status: 401 }
        )

        const isValid = await bcrypt.compare(password, user.password)

        if (!isValid) return NextResponse.json(
            { error: "Invalid credentials" },
            { status: 401 }
        )

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET!,
            { expiresIn: "7d" }
        )

        return NextResponse.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            }
        })
    } catch (error) {
        console.log(error)
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        )
    }
}