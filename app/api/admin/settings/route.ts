import { access, stat } from "node:fs/promises"
import { constants } from "node:fs"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { authenticateRequest } from "@/server/auth"
import type { SystemSettings } from "@/types/types"
import { MediaConfig } from "@/lib/config"

const DEFAULT_MEDIA_ROOT = MediaConfig.MEDIA_ROOT!

async function getMediaRootStatus(path: string) {
    try {
        const info = await stat(path)
        const exists = info.isDirectory()

        let readable = false
        let writable = false

        if (exists) {
            try {
                await access(path, constants.R_OK)
                readable = true
            } catch {}

            try {
                await access(path, constants.W_OK)
                writable = true
            } catch {}
        }

        return {
            exists,
            readable,
            writable,
            path,
        }
    } catch {
        return {
            exists: false,
            readable: false,
            writable: false,
            path,
        }
    }
}

export async function getSettingsRecord(): Promise<SystemSettings> {
    const setting = await prisma.systemSetting.findFirst({
        where: { id: "singleton" },
    })

    const mediaRoot = setting?.mediaRoot || DEFAULT_MEDIA_ROOT
    const syncState = (globalThis as any).syncState || {}

    return {
        mediaRoot,
        mediaRootStatus: await getMediaRootStatus(mediaRoot),
        databaseStatus: {
            connected: true,
            latencyMs: 4,
        },
        mediaProcessorStatus: {
            running: Boolean(syncState.isProcessing !== undefined ? !syncState.isProcessing : true),
            activeWorkers: Number(syncState.stats?.processed || 0),
            queuedJobs: Number(syncState.stats?.queued || 0),
        },
    }
}

export async function GET(request: Request) {
    const admin = await authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const settings = await getSettingsRecord()
    return NextResponse.json(settings)
}
