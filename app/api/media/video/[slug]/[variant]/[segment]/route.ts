import { NextRequest } from "next/server"
import { Storage } from "@/lib/storage"
import { MediaConfig } from "@/lib/config"

const storage = new Storage(MediaConfig.ASSETS_ROOT)

export const runtime = "nodejs"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; variant: string; segment: string }> }) {
  const { id, variant, segment } = await params
  const segmentPath = `videos/${id}/hls/${variant}/${segment}`

  if (!(await storage.exists(segmentPath))) {
    return new Response("Segment not found", { status: 404 })
  }

  const stream = await storage.stream(segmentPath)
  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "video/mp2t",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
