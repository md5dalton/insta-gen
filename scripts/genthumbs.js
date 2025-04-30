import { PrismaClient } from "@prisma/client"
import fs from "fs"
import path from "path"
import Ffmpeg from "fluent-ffmpeg"
import ffmpeg from "@ffmpeg-installer/ffmpeg"
import { arrayColumn, getHomeDir, getMediaDir, getThumsDir } from "../utils/functions.js"
import { find } from "../utils/finder.js"

Ffmpeg.setFfmpegPath(ffmpeg.path)

// Ensure the output folder exists
const outputDir = getThumsDir()

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)

const generateThumbnail = (videoPath, videoId, outputPath, timeInSeconds = 5) => new Promise((resolve, reject) => {
    if (fs.existsSync(videoPath)) {
        Ffmpeg(videoPath)
            .screenshots({
                timestamps: [timeInSeconds], // Generate a thumbnail at this timestamp
                filename: `${videoId}.jpg`, // Output filename pattern
                folder: outputPath,
                // size: "320x240", // Set thumbnail size
            })
            .on("end", () => {
                console.log("Thumbnail generated successfully!", videoPath)
                resolve()
            })
            .on("error", (err) => {
                console.error("Error generating thumbnail:", err)
                reject(err)
            })
    } else console.log("File does not exist", videoPath)
})


const prisma = new PrismaClient()
const mediaDir = getMediaDir()

const thumbs = await find(outputDir, ["jpg"])
const thumbsNames = thumbs.map(file => path.basename(file, path.extname(file)))
console.log("Thumbs found: ",  thumbsNames.length)

const videos = await prisma.media.findMany({
    where: {
        isVideo: true
    },
    select: {
        path: true,
        id: true,
    }
})
console.log("Videos found in DB: ",  videos.length)

const thumbsNamesIds = new Set(thumbsNames)
const newMedia = videos.filter(({ id }) => !thumbsNamesIds.has(id))
console.log("Videos to be processed", newMedia.length)

await Promise.all(newMedia.map(({ path, id }) => generateThumbnail(mediaDir + path, id, outputDir)))

console.log("Thumbs generated successfuly")
// console.table(newMedia)

// const video = videos.shift()

// generateThumbnail(mediaDir + video.path, video.id, outputDir)
//     .then(() => console.log("Thumbnail process completed"))
//     .catch((err) => console.error(err))
    