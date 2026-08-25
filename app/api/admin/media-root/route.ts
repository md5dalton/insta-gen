import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { resolveUserFromRequest } from "@/lib/auth"
import fs from "fs"
import path from "path"

export async function GET(req: Request) {
  try {
    await resolveUserFromRequest(req)

    const setting = await prisma.setting.findUnique({ where: { key: 'mediaRoot' } })
    const value = setting?.value ?? null

    let status = {
      exists: false,
      readable: false,
      writable: false,
    }

    if (value) {
      try {
        const resolved = path.resolve(value)
        status.exists = fs.existsSync(resolved)
        if (status.exists) {
          try {
            fs.accessSync(resolved, fs.constants.R_OK)
            status.readable = true
          } catch (e) {}
          try {
            fs.accessSync(resolved, fs.constants.W_OK)
            status.writable = true
          } catch (e) {}
        }
      } catch (e) {
        // ignore
      }
    }

    return NextResponse.json({ path: value, status })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: Request) {
  try {
    await resolveUserFromRequest(req)
    const { path: newPath } = await req.json()
    if (!newPath) return NextResponse.json({ error: 'path required' }, { status: 400 })

    const resolved = path.resolve(newPath)

    // Validate existence and access
    try {
      const exists = fs.existsSync(resolved)
      if (!exists) return NextResponse.json({ error: 'Path does not exist' }, { status: 400 })
      try {
        fs.accessSync(resolved, fs.constants.R_OK)
      } catch (e) {
        return NextResponse.json({ error: 'Path is not readable' }, { status: 400 })
      }
      try {
        fs.accessSync(resolved, fs.constants.W_OK)
      } catch (e) {
        // Writable not required but warn: we'll accept but inform
      }
    } catch (e) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    await prisma.setting.upsert({
      where: { key: 'mediaRoot' },
      create: { key: 'mediaRoot', value: resolved },
      update: { value: resolved }
    })

    return NextResponse.json({ path: resolved })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err?.message || 'Unauthorized' }, { status: 401 })
  }
}
