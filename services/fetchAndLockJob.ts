import prisma from "@/lib/prisma"

export async function fetchAndLockJob() {
    const now = new Date()

    const job = await prisma.job.findFirst({
        where: {
            status: "PENDING",
            availableAt: { lte: now },
        },
        orderBy: [
            { createdAt: "asc" }
        ],
    })

    if (!job) return null

    const updated = await prisma.job.updateMany({
        where: {
            id: job.id,
            status: "PENDING",
        },
        data: {
            status: "PROCESSING",
            lockedAt: now,
        },
    })

    if (updated.count === 0) return null

    return job
}