import jwt from "jsonwebtoken"
import prisma from "@/lib/prisma"

export type AuthUser = {
    id: string
    email: string
}

export type AuthContext = {
    user: AuthUser
}

const SECRET = process.env.JWT_SECRET!

export async function resolveUserFromRequest(req: Request) {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) throw new Error("Unauthorized")

    const decoded = jwt.verify(token, SECRET) as { userId: string }

    const user = await prisma.profileUser.findUnique({
        where: { id: decoded.userId },
        select: {
            id: true
        }
    })

    if (!user) throw new Error("User not found or revoked")

    return user
}