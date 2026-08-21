import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { File } from "node:buffer"
import { Storage } from "@/lib/storage"
import { ImageProcessor } from "@/lib/imageProcessor"
import { VideoProcessor } from "@/lib/videoProcessor"
import { mediaEngineConfig } from "@/lib/config"
import { ValidationError } from "@/lib/errors"
import { logger } from "@/lib/logger"

const storage = new Storage(mediaEngineConfig.mediaRoot)
const imageProcessor = new ImageProcessor(storage)
const videoProcessor = new VideoProcessor(storage)

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      throw new ValidationError("Upload requires a file")
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    if (bytes.length === 0) {
      throw new ValidationError("Uploaded file is empty")
    }

    const originalName = file.name ?? "upload"
    const extension = originalName.split(".").pop()?.toLowerCase() ?? ""
    const isVideo = ["mp4", "mov", "m4v", "webm", "mkv"].includes(extension)
    const isImage = ["jpg", "jpeg", "png", "webp"].includes(extension)
    if (!isImage && !isVideo) {
      throw new ValidationError("Unsupported media type")
    }

    if (bytes.length > 50 * 1024 * 1024) {
      throw new ValidationError("File is too large")
    }

    const id = randomUUID()
    const uploadPath = `uploads/${id}/${originalName}`
    await storage.saveFile(uploadPath, bytes)

    const assetPath = isVideo
      ? `videos/${id}/original.mp4`
      : `images/${id}/original`

    if (isVideo) {
      await videoProcessor.process(uploadPath, id)
    } else {
      await imageProcessor.process(uploadPath, id)
    }

    logger.info("Upload accepted", { uploadId: id, kind: isVideo ? "video" : "image" })

    return NextResponse.json({ id, status: "accepted", assetPath })
  } catch (error) {
    logger.error("Upload failed", { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    )
  }
}
