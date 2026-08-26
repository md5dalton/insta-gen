import crypto from "crypto"
import { db } from "./db"
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

export function authenticateRequest(authHeader?: string): AdminUser | null {
    if (!authHeader) return null
    const token = authHeader.replace(/^Bearer\s+/i, "").trim()
    if (db.tokens.has(token) && db.admin) {
        return db.admin
    }
    return null
}
