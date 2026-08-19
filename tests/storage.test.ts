import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import sharp from "sharp"
import { ImageProcessor } from "../lib/imageProcessor"
import { Storage } from "../lib/storage"

test("storage writes and reads files", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "insta-gen-"))
  const storage = new Storage(root)

  try {
    await storage.mkdir("nested")
    await storage.saveFile("nested/hello.txt", Buffer.from("ok"))

    assert.equal(await storage.exists("nested/hello.txt"), true)
    assert.equal(await storage.readFile("nested/hello.txt"), "ok")
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test("image processor normalizes dimensions for EXIF-rotated images", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "insta-gen-"))
  const storage = new Storage(root)
  const sourcePath = path.join(root, "rotated.jpg")

  try {
    await sharp({
      create: {
        width: 100,
        height: 200,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toFile(sourcePath)

    const result = await new ImageProcessor(storage).process(sourcePath, "rotated")

    assert.deepEqual(result, { width: 200, height: 100 })
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
