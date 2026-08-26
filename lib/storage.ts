import path from "node:path"
import { Readable } from "node:stream"
import { createReadStream, createWriteStream, promises as fs } from "node:fs"

export class StorageError extends Error {
    constructor(
        message: string,
        readonly cause?: unknown
    ) {
        super(message)
        this.name = "StorageError"
    }
}

export class Storage {
    constructor(private readonly rootDir: string) {}

    resolve(relativePath: string): string {
        const normalized = path.normalize(relativePath)
        if (normalized.startsWith("..")) {
            throw new StorageError("Invalid storage path")
        }

        if (path.isAbsolute(normalized)) {
            return normalized
        }

        return path.join(this.rootDir, normalized)
    }

    async saveFile(relativePath: string, content: Buffer | Uint8Array | string): Promise<string> {
        const absolutePath = this.resolve(relativePath)
        await this.mkdir(path.dirname(relativePath))
        await fs.writeFile(absolutePath, content)
        return absolutePath
    }

    async readFile(relativePath: string): Promise<string> {
        const absolutePath = this.resolve(relativePath)
        return fs.readFile(absolutePath, "utf8")
    }
    async readBuffer(relativePath: string): Promise<Buffer> {
        const absolutePath = this.resolve(relativePath)

        return fs.readFile(absolutePath)
    }
    async exists(relativePath: string): Promise<boolean> {
        try {
            await fs.access(this.resolve(relativePath))
            return true
        } catch {
            return false
        }
    }

    async mkdir(relativePath: string): Promise<void> {
        const absolutePath = this.resolve(relativePath)
        await fs.mkdir(absolutePath, { recursive: true })
    }

    async delete(relativePath: string): Promise<void> {
        const absolutePath = this.resolve(relativePath)
        await fs.rm(absolutePath, { recursive: true, force: true })
    }

    async copy(source: string, destination: string): Promise<void> {
        const sourcePath = this.resolve(source)
        const destinationPath = this.resolve(destination)
        await this.mkdir(path.dirname(destination))
        await fs.copyFile(sourcePath, destinationPath)
    }

    async move(source: string, destination: string): Promise<void> {
        const sourcePath = this.resolve(source)
        const destinationPath = this.resolve(destination)
        await this.mkdir(path.dirname(destination))
        await fs.rename(sourcePath, destinationPath)
    }

    async stream(
        relativePath: string,
        options?: {
            start?: number
            end?: number
        }
    ): Promise<Readable> {
        const absolutePath = this.resolve(relativePath)

        return createReadStream(absolutePath, options)
    }

    async stat(relativePath: string): Promise<{ size: number; mtimeMs: number }> {
        const absolutePath = this.resolve(relativePath)
        const stats = await fs.stat(absolutePath)
        return { size: stats.size, mtimeMs: stats.mtimeMs }
    }

    async writeStream(relativePath: string): Promise<NodeJS.WritableStream> {
        const absolutePath = this.resolve(relativePath)
        await this.mkdir(path.dirname(relativePath))
        return createWriteStream(absolutePath)
    }
}
