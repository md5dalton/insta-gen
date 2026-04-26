import { extname } from "path"
import prisma from "./prisma"
import { MEDIA_CONFIG } from "@/config/media"
import { Payload } from "@/types/type"

const VIDEO_EXTENSIONS = MEDIA_CONFIG.VIDEO_EXTENSIONS

export async function enqueueMediaJob({ file, ...rest }: Payload) {
    const ext = extname(file.path).toLowerCase()
    const isVideo = VIDEO_EXTENSIONS.includes(ext)

    const dedupeKey = `${rest.event}:${file.id}`

    try {
        await prisma.job.create({
            data: {
                type: "media",
                payload: {...rest, ...file},
                priority: isVideo ? 10 : 1,
                dedupeKey
            }
        })
    } catch {
        // duplicate job → ignore
    }
}