import { DIR_THUMB } from "@/config/media"
import { join } from "path"
import sharp from "sharp"
import { generateId } from "./path"
import { existsSync } from "fs"

export const getMetadata = async (filePath: string): Promise<{
    width: number,
    height: number
}> => {
    let width, height

    try {
        const { info } = await sharp(filePath)
            .rotate()
            .toBuffer({ resolveWithObject: true })

        width = info.width
        height = info.height

    } catch (err) {
        const meta = await sharp(filePath, { failOnError: false }).metadata()

        width = meta.width
        height = meta.height

        if ([5,6,7,8].includes(Number(meta.orientation))) {
            [width, height] = [height, width]
        }
    }

    return {
        width,
        height
    }
} 

export const generateThumbnail = async (filePath: string) => {

    const output = join(DIR_THUMB, `${generateId(filePath)}.jpg`)

    if (existsSync(output)) return
    
    const image = sharp(filePath, { failOnError: false })
    
    await image
        .rotate()
        .resize(320)
        .jpeg({ quality: 80, mozjpeg: true })
        .toFile(output)

}
