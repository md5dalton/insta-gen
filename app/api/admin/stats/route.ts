import { NextResponse } from "next/server"
import { db } from "@/server/db"
import { enrichMediaItem } from "@/server/policy"
import { authenticateRequest } from "@/server/auth"

export async function GET(request: Request) {
    const admin = authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const enriched = db.media.map(enrichMediaItem)
    const activeMedia = enriched.filter((m) => !m.isEffectivelyDeleted)
    const totalFiles = activeMedia.length
    const readyFiles = activeMedia.filter((m) => m.processingStatus === "READY").length
    const processingFiles = activeMedia.filter((m) => m.processingStatus === "PROCESSING").length
    const errorFiles = activeMedia.filter(
        (m) => m.processingStatus === "FAILED" || m.processingStatus === "NEEDS_PROCESSING"
    ).length
    let totalRenditions = 0
    let readyRenditions = 0
    let missingRenditions = 0
    let failedRenditions = 0
    activeMedia.forEach((m) => {
        m.assets.forEach((a) => {
            totalRenditions++
            if (a.status === "READY") readyRenditions++
            if (a.status === "MISSING") missingRenditions++
            if (a.status === "FAILED") failedRenditions++
        })
    })
    const totalStorageBytes = activeMedia.reduce((acc, m) => {
        let sum = m.size
        m.assets.forEach((a) => {
            sum += a.size || 0
        })
        return acc + sum
    }, 0)
    const stats = {
        totalFiles,
        readyFiles,
        processingFiles,
        errorFiles,
        totalStorageBytes,
        totalRootCollections: db.rootCollections.filter((r) => !r.deletedAt).length,
        totalCollections: db.collections.filter((c) => !c.deletedAt).length,
        totalMediaUsers: db.mediaUsers.filter((u) => !u.deletedAt).length,
        renditions: {
            total: totalRenditions,
            ready: readyRenditions,
            missing: missingRenditions,
            failed: failedRenditions,
        },
        recentActivity: db.recentActivity.slice(0, 10),
    }
    return NextResponse.json(stats)
}
