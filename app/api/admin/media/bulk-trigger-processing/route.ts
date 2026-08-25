import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { resolveUserFromRequest } from "@/lib/auth"
import { ImageProcessor } from "@/lib/imageProcessor"
import { VideoProcessor } from "@/lib/videoProcessor"
import { Storage } from "@/lib/storage"
import { MediaConfig } from "@/lib/config"

const storage = new Storage(MediaConfig.ASSETS_ROOT)

export async function POST(req: Request) {
  try {
    await resolveUserFromRequest(req)
    const { ids } = await req.json()
    if (!Array.isArray(ids)) return NextResponse.json({ error: 'ids required' }, { status: 400 })

    const media = await prisma.media.findMany({ where: { id: { in: ids } } })

    const results: { id: string; ok: boolean; error?: string }[] = []

    for (const m of media) {
      try {
        const absPath = `${MediaConfig.MEDIA_ROOT}/${m.path}`
        if (m.type === 'IMAGE') {
          const ip = new ImageProcessor(storage)
          await ip.process(absPath, m.id)
        } else {
          const vp = new VideoProcessor(storage, absPath, m.id)
          await vp.process()
        }
        results.push({ id: m.id, ok: true })
      } catch (e: any) {
        results.push({ id: m.id, ok: false, error: e?.message || String(e) })
      }
    }

    return NextResponse.json({ results })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err?.message || 'Unauthorized' }, { status: 401 })
  }
}
