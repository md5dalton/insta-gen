import prisma from "./prisma"

const MAX_ATTEMPTS = 3

export async function markDone(id: string) {
    await prisma.job.update({
        where: { id },
        data: {
            status: "DONE"
        }
    })
}

export async function markFailed(job: any) {
    const attempts = job.attempts + 1

    await prisma.job.update({
        where: { id: job.id },
        data: {
            status: attempts >= MAX_ATTEMPTS ? "FAILED" : "PENDING",
            attempts,
            availableAt: new Date(Date.now() + attempts * 5000),
        },
    })
}

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