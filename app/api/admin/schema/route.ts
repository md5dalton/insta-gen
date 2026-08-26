import { NextResponse } from "next/server"
import { authenticateRequest } from "@/server/auth"

export async function GET(request: Request) {
    const admin = authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const prismaSchemaCode = `// Prisma Schema for Media Management & Transcoding Dashboard\n...`
    return NextResponse.json({
        prismaFilePath: "prisma/schema.prisma",
        prismaSchema: prismaSchemaCode,
    })
}
