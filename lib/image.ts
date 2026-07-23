import { join } from "path"
import sharp from "sharp"
import { generateId } from "./path"
import { existsSync } from "fs"
import { DIR_FEED_IMAGES, DIR_THUMB } from "@/config/media"

export default class ImageProcessor {
    path: string

    width = 0
    height = 0
    format?: string
    orientation?: number

    constructor(path: string) {
        this.path = path
    }

    async init() {
        const meta = await sharp(this.path, {
            failOnError: false,
        }).metadata()

        this.format = meta.format
        this.orientation = meta.orientation

        this.width = meta.width ?? 0
        this.height = meta.height ?? 0

        // normalize dimensions based on EXIF
        if ([5, 6, 7, 8].includes(Number(this.orientation))) {
            [this.width, this.height] = [
                this.height,
                this.width,
            ]
        }

        return this
    }

    needsFeed() {
        return (
            this.width > 1080 ||
            this.height > 1080 ||
            [5, 6, 7, 8].includes(Number(this.orientation))
        )
    }

    async process() {
        const tasks = []

        if (this.needsFeed()) {
            tasks.push(this.generateFeed())
        }

        tasks.push(this.generateThumb())

        await Promise.all(tasks)
    }

    async generateFeed() {
        const output = join(
            DIR_FEED_IMAGES,
            `${generateId(this.path)}.webp`
        )

        if (existsSync(output)) return

        await sharp(this.path, {
            failOnError: false,
        })
            .rotate()
            .resize({
                width: 1080,
                height: 1080,
                fit: "inside",
                withoutEnlargement: true,
            })
            .webp({
                quality: 100
            })
            .toFile(output)
    }

    async generateThumb() {
        const output = join(
            DIR_THUMB,
            `${generateId(this.path)}.jpg`
        )

        if (existsSync(output)) return

        await sharp(this.path, {
            failOnError: false,
        })
            .rotate()
            .resize(320)
            .jpeg({
                quality: 80,
                mozjpeg: true,
            })
            .toFile(output)
    }
}
