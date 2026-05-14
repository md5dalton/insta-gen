import "dotenv/config"
import prisma from "@/lib/prisma"
import fs from "fs/promises"
import path from "path"
import { DIR_THUMB } from "@/config/media"


async function main() {
    console.log("Loading media ids...")

    const media = await prisma.media.findMany({
        select: {
            id: true
        }
    })

    const valid = new Set(
        media.map(m => `${m.id}.jpg`)
    )

    console.log(`DB media: ${valid.size}`)

    let deleted = 0

    const dir = await fs.opendir(DIR_THUMB)

    for await (const entry of dir) {
        if (!entry.isFile()) continue

        if (!valid.has(entry.name)) {
            const file = path.join(
                DIR_THUMB,
                entry.name
            )

            await fs.unlink(file)

            deleted++

            console.log(`Deleted ${entry.name}`)
        }
    }

    console.log(`Done. Removed ${deleted} ghost thumbs.`)
}

main()
    .catch(err => {
        console.error(err)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })