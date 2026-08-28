import crypto from "crypto"
import prisma from "@/lib/prisma"
import { AdminUser } from "@/types/types"

export function hashPassword(password: string): string {
    const salt = "media_mgmt_salt_2026"
    return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex")
}

export function verifyPassword(password: string, hash: string): boolean {
    return hashPassword(password) === hash
}

export function generateToken(): string {
    return crypto.randomBytes(32).toString("hex")
}

export async function authenticateRequest(authHeader?: string): Promise<AdminUser | null> {
    if (!authHeader) return null
    const token = authHeader.replace(/^Bearer\s+/i, "").trim()

    try {
        const session = await prisma.adminSession.findUnique({ where: { token }, include: { adminUser: true } })
        if (!session || !session.adminUser) return null

        const adminRec = session.adminUser
        return {
            id: adminRec.id,
            name: adminRec.name,
            email: adminRec.email,
            createdAt: adminRec.createdAt.toISOString(),
        }
    } catch (e) {
        // If DB call fails, treat as unauthorized rather than using an in-memory cache
        return null
    }
}
