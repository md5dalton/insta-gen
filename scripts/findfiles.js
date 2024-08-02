import { PrismaClient } from "@prisma/client"
import { find } from "../utils/finder.js"
import { arrayDiff } from "../utils/functions.js"

const dir = "/media/images"
const ext = ["jpg", "jpeg", "png", "webp", "mp4"]

const files = await find(dir, ext)
console.log("found: ",  files.length)

const prisma = new PrismaClient()

const DBfiles = await prisma.file.findMany()
console.log("Existing: ",  DBfiles.length)

const DBids = DBfiles.map(({ path }) => path)

const newFiles = arrayDiff(files, DBids)
console.log("New: ",  newFiles.length)

if (newFiles.length) {

    const pr = await prisma.file.createMany({
        data: newFiles.map(item => ({path: item }))
    })

    console.log(pr)
    
}