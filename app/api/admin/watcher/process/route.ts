import { NextResponse } from "next/server"
import { authenticateRequest } from "@/server/auth"
import prisma from "@/lib/prisma"
import { dirname, extname, sep, join } from "path"
import { generateId } from "@/lib/path"
import { MediaService } from "@/services/mediaService"
import { MediaConfig } from "@/lib/config"

const CONFIG = MediaConfig

export async function POST(request: Request) {
    const admin = await authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const limit = Number(body.limit || 100)

    // fetch unprocessed placeholders via Prisma
    const rows = await prisma.scannedFile.findMany({
        where: { processed: false },
        orderBy: { createdAt: "asc" },
        take: limit,
        select: { id: true, path: true },
    })

    const mediaService = new MediaService(prisma)

    const results: Array<{ id: string; path: string; status: string; error?: string }> = []

    for (const row of rows) {
        const { id, path } = row
        try {
            const directory = dirname(path)
            const relative = directory.replace(CONFIG.MEDIA_ROOT, "").replace(/^\/+/, "")
            const parts = relative.split(sep).filter(Boolean)
            if (parts.length < 3) {
                results.push({ id, path, status: "skipped", error: "path depth < 3" })
                continue
            }

            const tags: string[] = []
            const [rootCollectionName, collectionName, userName] = parts

            // ensure tags for intermediate parts
            for (let i = 0; i < parts.length; i++) {
                const tagPath = join(...parts.slice(0, i + 1))
                const tagId = generateId(tagPath)
                await prisma.tag.upsert({ where: { id: tagId }, update: { name: tagPath.split(sep).pop() || tagPath }, create: { id: tagId, name: tagPath.split(sep).pop() || tagPath } })
                tags.push(tagId)
            }

            // ensure hierarchy
            const rootId = generateId(`/${rootCollectionName}`)
            await prisma.rootCollection.upsert({ where: { id: rootId }, update: { name: rootCollectionName }, create: { id: rootId, name: rootCollectionName, path: `/${rootCollectionName}` } })

            const collectionPath = `/${rootCollectionName}/${collectionName}`
            const collectionId = generateId(collectionPath)
            await prisma.collection.upsert({ where: { id: collectionId }, update: { name: collectionName }, create: { id: collectionId, name: collectionName, path: collectionPath, ownerId: rootId } })

            const userPath = `${collectionPath}/${userName}`
            const userId = generateId(userPath)
            await prisma.user.upsert({ where: { id: userId }, update: { name: userName }, create: { id: userId, name: userName, path: userPath, ownerId: collectionId } })

            // call processing logic
            await mediaService.handleAddOrChange({ id, path }, userId, tags)

            // mark processed
            await prisma.scannedFile.update({ where: { id }, data: { processed: true } })

            results.push({ id, path, status: "processed" })
        } catch (err: any) {
            console.error("Failed processing scanned file", row, err)
            results.push({ id: row.id, path: row.path, status: "error", error: err?.message || String(err) })
        }
    }

    return NextResponse.json({ processed: results.length, results })
}
