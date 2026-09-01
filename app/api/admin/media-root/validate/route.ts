import { NextResponse } from "next/server"
import fs from "fs/promises"
import { constants as fsConstants } from "fs"
import { execFile } from "child_process"
import { promisify } from "util"

const execFileAsync = promisify(execFile)

export async function POST(request: Request) {
    const body = await request.json().catch(() => ({}))
    const targetPath = typeof body.path === "string" ? body.path.trim() : ""

    if (!targetPath) {
        return NextResponse.json({ error: "Valid path string is required" }, { status: 400 })
    }

    if (!targetPath.startsWith("/")) {
        return NextResponse.json({ error: "Media root must be an absolute filesystem path." }, { status: 400 })
    }

    const start = Date.now()
    let exists = false
    let readable = false
    let writable = false
    let detectedRoots: string[] = []

    try {
        const stat = await fs.stat(targetPath)
        exists = true

        try {
            await fs.access(targetPath, fsConstants.R_OK)
            readable = true
        } catch (e) {
            // not readable
        }

        try {
            await fs.access(targetPath, fsConstants.W_OK)
            writable = true
        } catch (e) {
            // not writable
        }

        if (stat.isDirectory()) {
            try {
                const entries = await fs.readdir(targetPath, { withFileTypes: true })
                detectedRoots = entries.filter((d) => d.isDirectory()).slice(0, 20).map((d) => d.name)
            } catch (e) {
                // ignore
            }
        }
    } catch (err) {
        // path does not exist or inaccessible
    }

    const latencyMs = Date.now() - start

    let totalSpaceBytes = 0
    let freeSpaceBytes = 0

    try {
        const usage = await (async function getDiskUsage(p: string) {
            try {
                const { stdout } = (await execFileAsync("df", ["-kP", p])) as { stdout: string }
                const lines = stdout.trim().split(/\r?\n/)
                if (lines.length < 2) return null
                const cols = lines[1].trim().replace(/\s+/g, " ").split(" ")
                // df -kP gives: Filesystem 1024-blocks Used Available Capacity Mounted on
                const totalKb = parseInt(cols[1], 10) || 0
                const availKb = parseInt(cols[3], 10) || 0
                return { total: totalKb * 1024, free: availKb * 1024 }
            } catch (e) {
                return null
            }
        })(targetPath)

        if (usage) {
            totalSpaceBytes = usage.total
            freeSpaceBytes = usage.free
        }
    } catch (e) {
        // ignore disk probe errors
    }

    const result = {
        valid: exists && readable && writable,
        path: targetPath,
        exists,
        readable,
        writable,
        storageType: "Local filesystem mount",
        totalSpaceBytes,
        freeSpaceBytes,
        detectedRoots,
        latencyMs,
        message: !exists ? "Path does not exist." : !readable ? "Path not readable." : !writable ? "Path not writable." : "Path validated successfully.",
    }

    return NextResponse.json(result)
}
