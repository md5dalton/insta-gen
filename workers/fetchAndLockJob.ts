import prisma from "@/lib/prisma"

export async function fetchAndLockJob() {
    const now = new Date()

    const job = await prisma.job.findFirst({
        where: {
            status: "pending",
            availableAt: { lte: now },
        },
        orderBy: [
            { priority: "desc" },
            { createdAt: "asc" }
        ],
    })

    if (!job) return null

    const updated = await prisma.job.updateMany({
        where: {
            id: job.id,
            status: "pending",
        },
        data: {
            status: "processing",
            lockedAt: now,
        },
    })

    if (updated.count === 0) return null

    return job
}