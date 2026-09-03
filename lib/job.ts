import prisma from "./prisma"
import { Payload } from "@/types/type"

export async function enqueueMediaJob({ file, ...rest }: Payload) {

    const dedupeKey = `${rest.event}:${file.path}`

    try {
        await prisma.job.create({
            data: {
                type: "media",
                payload: {...rest, ...file},
                dedupeKey
            }
        })
    } catch {
        // duplicate job → ignore
    }
}