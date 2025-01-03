import { PrismaClient } from "@prisma/client"
import { find } from "../utils/finder.js"
import { arrayDiff, getMediaDir } from "../utils/functions.js"

const dir = getMediaDir()
const ext = ["jpg", "jpeg", "png", "webp", "mp4"]

const files = await find(dir, ext)
console.log("found: ",  files.length)

const prisma = new PrismaClient()

const DBfiles = await prisma.file.findMany()
console.log("Existing: ",  DBfiles.length)

const DBids = DBfiles.map(({ path }) => path)
const relativeFiles = files.map(file => file.replaceAll(dir, ""))

const newFiles = arrayDiff(relativeFiles, DBids)
console.log("New: ",  newFiles.length)

if (newFiles.length) {

    const pr = await prisma.file.createMany({
        data: newFiles.map(item => ({path: item }))
    })

    console.log(pr)
    
}