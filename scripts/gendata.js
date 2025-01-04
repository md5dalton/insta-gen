import fs from "fs/promises"
import { PrismaClient } from "@prisma/client"
import { arrayColumn, arrayDiff, chunk, encode, getMediaDir, group, isVideo } from "../utils/functions.js"
import sharp from "sharp"
import Ffmpeg from "fluent-ffmpeg"
import ffprobe from "@ffprobe-installer/ffprobe"

Ffmpeg.setFfprobePath(ffprobe.path)

const getVideoData = path => new Promise((resolve, reject) => {
    
    Ffmpeg.ffprobe(path, (err, metadata) => {
      
        if (err) return reject(err)

        const videoStream = metadata.streams.find(stream => stream.codec_type === "video")
        
        if (!videoStream) return reject(new Error("No video stream found"))

        const { width, height } = videoStream

        resolve({ width, height })
    
    })
})

class Image
{
    #items = []
    #newItems = []
    #db = []

    #data
    prisma

    metadata = []

    constructor () {

        this.prisma = new PrismaClient()

    }

    async getMetadata (media) {

        await Promise.all(
            media.map(async ({ path, id, isVideo }) => {
                
                const realPath = getMediaDir() + path
                
                const { birthtime } = await fs.stat(realPath)
                
                const { height, width } = isVideo ?
                    await getVideoData(realPath) :
                    await sharp(realPath).metadata()
                
                const model = {
                    mediaId: id,
                    mktime: birthtime,
                    height,
                    width,
                    portrait: height > width ? true : false
                }

                this.metadata.push(model)

            })

        )

    }

    async getItems () {

        return await this.prisma.media.findMany({
            select: {
                path: true,
                id: true,
                ownerId: true,
                isVideo: true
            }
        })
        
    }

    async addToDB () {

        const media = await this.getItems()
        console.log("Existing", media.length)

        const DBmetadata = await this.prisma.metadata.findMany({select: {mediaId: true}})
        const metadataIds = new Set(arrayColumn(DBmetadata, "mediaId"))

        const newMedia = media.filter(({ id }) => !metadataIds.has(id))
        console.log("New", newMedia.length)
        
        await this.getMetadata(newMedia)

        await this.prisma.metadata.createMany({
            data: this.metadata
        })
    }
}

const generator = new Image()

await generator.addToDB()