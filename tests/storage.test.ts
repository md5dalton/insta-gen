import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
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
