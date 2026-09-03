import prisma from "@/lib/prisma"

const MAX_ATTEMPTS = 3

export async function markDone(id: string) {
    // await prisma.job.update({
    //     where: { id },
    //     data: { status: "done" },
    // })
    await prisma.job.delete({
        where: { id }
    })
}

export async function markFailed(job: any) {
    const attempts = job.attempts + 1

    await prisma.job.update({
        where: { id: job.id },
        data: {
            status: attempts >= MAX_ATTEMPTS ? "failed" : "pending",
            attempts,
            availableAt: new Date(Date.now() + attempts * 5000),
        },
    })
}