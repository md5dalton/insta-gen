import { PrismaClient } from "@prisma/client"
import { find } from "../utils/finder.js"
import { arrayColumn, arrayDiff, encode, group } from "../utils/functions.js"

const rootDir = "/media/images"

const prisma = new PrismaClient()

const DBfiles = await prisma.file.findMany()
console.log("Found: ",  DBfiles.length)

// /media/images/{collection}/{user}/a.jpg
// /media/images/{collection}/{user}/subdir/b.jpg



const models = {
    collection: [],
    user: [],
    post: [],
    media: []
}

const getChildren = (dir, items) => group(items, ({ path }) => dir + "/" + path.replace(dir + "/", "").split("/").shift())

const collections = getChildren(rootDir, DBfiles)

collections.forEach(({ directory: collectionPath, items: collectionFiles }) => {

    const collection = {
        id: encode(collectionPath),
        name: collectionPath.split("/").pop(),
        path: collectionPath.replace(rootDir, "")
    }

    models.collection.push(collection)

    getChildren(collectionPath, collectionFiles).forEach(({ directory: userPath, items: userFiles }) => {

        const user = {
            id: encode(userPath),
            name: userPath.split("/").pop(),
            path: userPath.replace(collectionPath, ""),
            ownerId: collection.id
        }

        models.user.push(user)

        


    })

})

console.log(models.collection.shift())

// DBfiles.slice(0, 1).forEach(({ path }) => {

//     const collection = path.replace(rootDir, "").split("/").shift()

//     const collectionPath = rootDir + collection

//     console.log(collection)

// })


// const newFiles = arrayDiff(files, DBids)
// console.log("New: ",  newFiles.length)

// if (newFiles.length) {

//     const pr = await prisma.file.createMany({
//         data: newFiles.map(item => ({path: item }))
//     })

//     console.log(pr)
    
// }