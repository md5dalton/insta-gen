import { PrismaClient } from "@prisma/client"
import { arrayColumn, chunk, encode, group, isVideo } from "../utils/functions.js"

const rootDir = "/media/images"

const prisma = new PrismaClient()

const DBfiles = await prisma.file.findMany()
console.log("Found: ",  DBfiles.length)

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
        
        const fileGroups = chunk(userFiles, 10)

        fileGroups.forEach((fileGroup, i) => {
            
            const postPath = `${userPath}:${i}`

            const post = {
                id: encode(postPath),
                path: postPath.replace(userPath, ""),
                ownerId: user.id
            }

            models.post.push(post)

            fileGroup.forEach(({ path: mediaPath }) => {

                const video = isVideo(mediaPath)

                const media = {
                    id: encode(mediaPath),
                    path: mediaPath,
                    ownerId: post.id,
                    filePath: mediaPath,
                    type: video ? "VIDEO" : "IMAGE"
                }


                if (!post.thumb) post.thumb = video ? `t:${media.id}` : `m:${media.id}`

                models.media.push(media)

            })
            
            if (!user.picture) user.picture = post.thumb

        })


    })

})


for (const model in models) {
    
    const DBmodels = await prisma[model].findMany({select: {id: true}})
    const DBmodelsIds = arrayColumn(DBmodels, "id")

    const newModels = models[model].filter(({ id }) => !DBmodelsIds.includes(id))
    console.log(`New ${model}:`, newModels.length)

    await prisma[model].createMany({
        data: newModels 
    })

}