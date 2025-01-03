import { PrismaClient } from "@prisma/client"
import { arrayColumn, chunk, encode, getMediaDir, group, isVideo } from "../utils/functions.js"

const rootDir = "/media"

const prisma = new PrismaClient()

const DBfiles = await prisma.file.findMany()
console.log("Found: ",  DBfiles.length)

const models = {
    collection: [],
    user: [],
    post: [],
    media: []
}

const collections = {}
const users = {}
const tags = {}
const medias = {}

// const getChildren = (dir, items) => group(items, ({ path }) => dir + "/" + path.replace(dir + "/", "").split("/").shift())

// const collections = getChildren(rootDir, DBfiles)
// console.log(DBfiles.pop())

class Model
{
    id
    name
    path
    
    constructor (path) {
    
        this.path = path
        this.id = encode(this.path)
        this.name = path.split("/").pop()
    
    }

}

class ChildModel extends Model
{
    ownerId

    constructor (owner, name) {

        super(owner.path + `/${name}`)

        this.ownerId = owner.id

    }
}

class RootCollection extends Model {}
class Collection extends ChildModel {}
class User extends ChildModel
{
    media = []
}
class Tag extends ChildModel {}
class Media extends ChildModel
{
    type

    constructor (owner, name) {
        super(owner, name)
        this.type = isVideo(this.path)
    }
}


DBfiles.forEach(({ path }) => {

    const [space, collection1, collection2, user, ...rest] = path.split("/")

    const modelCollection1 = new RootCollection(`/${collection1}`)
    const modelCollection2 = new Collection(modelCollection1, collection2)

    const modelUser = new User(
        modelCollection2,
        user
    )

    const modelMedia = new Media(
        modelUser,
        rest.join("/")
    )
    
    collections[modelCollection1.id] = modelCollection1
    collections[modelCollection2.id] = modelCollection2

    if (!users[modelUser.id]) users[modelUser.id] = modelUser
    users[modelUser.id].media.push(modelMedia)

    medias[modelMedia.id] = modelMedia

    if (rest.length > 1) {

        rest.pop()
            
        rest.forEach((item, index) => {
                
            const modelTag = new Tag(
                index == 0 ? modelUser : modelTag,
                item
            )

            tags[modelTag.id] = modelTag

        })

    }

})

// const i = group(Object.values(users), ({ id }) => ))



Object.values(users).forEach(({ id, media }) => {
    const fileGroups = chunk(userFiles, 10)

})
console.log(Object.values(users).pop())

// collections.forEach(({ directory: collectionPath, items: collectionFiles }) => {

//     const collection = {
//         id: encode(collectionPath),
//         name: collectionPath.split("/").pop(),
//         path: collectionPath.replace(rootDir, "")
//     }

//     models.collection.push(collection)

//     getChildren(collectionPath, collectionFiles).forEach(({ directory: userPath, items: userFiles }) => {
        
//         const user = {
//             id: encode(userPath),
//             name: userPath.split("/").pop(),
//             path: userPath.replace(collectionPath, ""),
//             ownerId: collection.id
//         }
        
//         models.user.push(user)
        
//         const fileGroups = chunk(userFiles, 10)

//         fileGroups.forEach((fileGroup, i) => {
            
//             const postPath = `${userPath}:${i}`

//             const post = {
//                 id: encode(postPath),
//                 path: postPath.replace(userPath, ""),
//                 ownerId: user.id
//             }

//             models.post.push(post)

//             fileGroup.forEach(({ path: mediaPath }) => {

//                 const video = isVideo(mediaPath)

//                 const media = {
//                     id: encode(mediaPath),
//                     path: mediaPath,
//                     ownerId: post.id,
//                     filePath: mediaPath,
//                     type: video ? "VIDEO" : "IMAGE"
//                 }


//                 if (!post.thumb) post.thumb = video ? `t:${media.id}` : `m:${media.id}`

//                 models.media.push(media)

//             })
            
//             if (!user.picture) user.picture = post.thumb

//         })


//     })

// })


// for (const model in models) {
    
//     const DBmodels = await prisma[model].findMany({select: {id: true}})
//     const DBmodelsIds = arrayColumn(DBmodels, "id")

//     const newModels = models[model].filter(({ id }) => !DBmodelsIds.includes(id))
//     console.log(`New ${model}:`, newModels.length)

//     await prisma[model].createMany({
//         data: newModels 
//     })

// }