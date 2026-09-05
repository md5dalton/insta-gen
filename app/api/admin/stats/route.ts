import { NextResponse } from "next/server"
import { authenticateRequest } from "@/server/auth"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
    const admin = await authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const [
            totalFiles,
            readyFiles,
            processingFiles,
            errorFiles,
            imageCount,
            videoCount,
            newMediaCount,
            needsProcessingCount,
            processingFailuresCount,
            markedDeletedCount,
            readyCount,
            processingCount,
            totalRenditions,
            readyRenditions,
            missingRenditions,
            failedRenditions,
            mediaSum,
            totalRootCollections,
            totalCollections,
            totalMediaUsers,
            recentActivity,
        ] = await Promise.all([
            prisma.mediaItem.count({ where: { deletedAt: null } }),
            prisma.mediaItem.count({ where: { deletedAt: null, processingStatus: "READY" } }),
            prisma.mediaItem.count({ where: { deletedAt: null, processingStatus: "PROCESSING" } }),
            prisma.mediaItem.count({ where: { deletedAt: null, processingStatus: { in: ["FAILED", "NEEDS_PROCESSING"] } } }),
            prisma.mediaItem.count({ where: { deletedAt: null, type: "IMAGE" } }),
            prisma.mediaItem.count({ where: { deletedAt: null, type: "VIDEO" } }),
            prisma.mediaItem.count({ where: { deletedAt: null, processingStatus: "NEW" } }),
            prisma.mediaItem.count({ where: { deletedAt: null, processingStatus: "NEEDS_PROCESSING" } }),
            prisma.mediaItem.count({ where: { deletedAt: null, processingStatus: "FAILED" } }),
            prisma.mediaItem.count({ where: { deletedAt: { not: null } } }),
            prisma.mediaItem.count({ where: { deletedAt: null, processingStatus: "READY" } }),
            prisma.mediaItem.count({ where: { deletedAt: null, processingStatus: "PROCESSING" } }),
            prisma.mediaAsset.count({ where: { media: { deletedAt: null } } }),
            prisma.mediaAsset.count({ where: { status: "READY", media: { deletedAt: null } } }),
            prisma.mediaAsset.count({ where: { status: "MISSING", media: { deletedAt: null } } }),
            prisma.mediaAsset.count({ where: { status: "FAILED", media: { deletedAt: null } } }),
            prisma.mediaItem.aggregate({ _sum: { size: true }, where: { deletedAt: null } }).then((r) => (r._sum.size as any) ?? 0n),
            prisma.rootCollection.count({ where: { deletedAt: null } }),
            prisma.collection.count({ where: { deletedAt: null } }),
            prisma.mediaUser.count({ where: { deletedAt: null } }),
            prisma.activityLog.findMany({ orderBy: { timestamp: "desc" }, take: 10 }),
        ])

        const totalStorageBytes = Number(mediaSum)

        const stats = {
            totalFiles,
            totalMedia: totalFiles,
            readyFiles,
            processingFiles,
            errorFiles,
            imageCount,
            videoCount,
            newMediaCount,
            needsProcessingCount,
            processingFailuresCount,
            markedDeletedCount,
            readyCount,
            processingCount,
            totalStorageBytes,
            totalRootCollections,
            totalCollections,
            totalMediaUsers,
            renditions: {
                total: totalRenditions,
                ready: readyRenditions,
                missing: missingRenditions,
                failed: failedRenditions,
            },
            recentActivity: recentActivity.map((a: any) => ({
                id: a.id,
                type: a.type,
                title: a.title,
                description: a.description,
                timestamp: a.timestamp,
            })),
        }

        return NextResponse.json(stats)
    } catch (e) {
        return NextResponse.json({ error: "Failed to compute stats" }, { status: 500 })
    }
}
