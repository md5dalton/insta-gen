import jwt from "jsonwebtoken"
import prisma from "@/lib/prisma"
import { UserCapability, UserRole } from "@/prisma/generated/enums"

export type AuthUser = {
    id: string
    role: UserRole
    capability: UserCapability
}

export type AuthContext = {
    user: AuthUser
}

const SECRET = process.env.JWT_SECRET!

export async function resolveUserFromRequest(req: Request): Promise<AuthUser> {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) throw new Error("Unauthorized")

    const decoded = jwt.verify(token, SECRET) as { userId: string }

    const user = await prisma.profileUser.findUnique({
        where: { id: decoded.userId },
        select: {
            id: true,
            role: true,
            capability: true
        },
    })

    if (!user) throw new Error("User not found or revoked")

    return user
}
