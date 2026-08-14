import { NextRequest } from "next/server"
import { Storage } from "@/lib/storage"
import { mediaEngineConfig } from "@/lib/config"

const storage = new Storage(mediaEngineConfig.storageRoot)

export const runtime = "nodejs"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; variant: string }> }) {
  const { id, variant } = await params
  const playlistPath = `videos/${id}/hls/${variant}/index.m3u8`

  if (!(await storage.exists(playlistPath))) {
    return new Response("Playlist not found", { status: 404 })
  }

  const content = await storage.readFile(playlistPath)
  return new Response(content, {
    headers: {
      "Content-Type": "application/vnd.apple.mpegurl",
      "Cache-Control": "no-store",
    },
  })
}
