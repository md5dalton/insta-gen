import { NextResponse } from "next/server"
import bcrypt from "bcrypt"
import prisma from "@/lib/prisma"
import jwt from "jsonwebtoken"

export async function POST(req: Request) {
    try {
        const { email, password, name } = await req.json()
        
        if (!email || !password || !name) return NextResponse.json(
            { error: "Email and password required" },
            { status: 400 }
        )
        
        const existingUser = await prisma.profileUser.findUnique({
            where: { email },
        })
        
        if (existingUser) return NextResponse.json(
            { error: "User already exists" },
            { status: 400 }
        )
        
        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.profileUser.create({
            data: {
                email,
                password: hashedPassword,
                name,
            }
        })

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