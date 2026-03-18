import { extname } from "path"
import prisma from "./prisma"
import { MEDIA_CONFIG } from "@/config/media"

const VIDEO_EXTENSIONS = MEDIA_CONFIG.VIDEO_EXTENSIONS

export async function enqueueMediaJob(payload: {
    filePath: string
    event: "add" | "change" | "delete"
    userId: string
    tags: string[]
}) {
    const ext = extname(payload.filePath).toLowerCase()
    const isVideo = VIDEO_EXTENSIONS.includes(ext)

    const dedupeKey = `${payload.event}:${payload.filePath}`

    try {
        await prisma.job.create({
            data: {
                type: "media",
                payload,
                priority: isVideo ? 10 : 1,
                dedupeKey
            }
        })
    } catch {
        // duplicate job → ignore
    }
}