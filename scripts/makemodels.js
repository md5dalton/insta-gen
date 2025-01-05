import { PrismaClient } from "@prisma/client"
import { arrayColumn, chunk, encode, getMediaDir, group, isVideo } from "../utils/functions.js"

const rootDir = "/media"

const prisma = new PrismaClient()

const DBfiles = await prisma.file.findMany()
console.log("Found: ",  DBfiles.length)

const rootCollections = {}
const collections = {}
const users = {}
const tags = {}

const posts = []
const mediaTags = []
const medias = []

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
    #media = []

    get media () {
        return this.#media
    }
    addMedia (media) {
        return this.#media.push(media)
    }
}
class Tag 
{
    id
    name
    
    constructor (path) {
        
        this.id = encode(path)
        this.name = path.split("/").pop()
    
    }
}

class Post extends ChildModel
{
    thumb
}
class Media
{
    isVideo

    constructor (owner, name) {
        
        this.path = owner.path + `/${name}`
        this.id = encode(this.path)
        this.isVideo = isVideo(this.path)
    }
}

class MediaTag
{
    id
    tagId
    mediaId

    constructor (tagId, mediaId) {

        this.id = encode(tagId + mediaId)

        this.tagId = tagId
        this.mediaId = mediaId

    }
}

DBfiles.forEach(({ path }) => {

    const [space, rootCollection, collection, user, ...rest] = path.split("/")

    const modelRootCollection = new RootCollection(`/${rootCollection}`)
    const modelCollection = new Collection(modelRootCollection, collection)

    const modelUser = new User(
        modelCollection,
        user
    )

    const modelMedia = new Media(
        modelUser,
        rest.join("/")
    )
    
    rootCollections[modelRootCollection.id] = modelRootCollection
    collections[modelCollection.id] = modelCollection

    if (!users[modelUser.id]) users[modelUser.id] = modelUser
    users[modelUser.id].addMedia(modelMedia)

    if (rest.length > 1) {

        rest.pop()
            
        rest.forEach((item, index) => {
                
            const modelTag = new Tag(modelUser.path + "/" + rest.slice(0, index + 1).join("/"))

            tags[modelTag.id] = modelTag

            mediaTags.push(new MediaTag(modelTag.id, modelMedia.id))

        })

    }

})

for (const userId in users) {

    const user = users[userId]
    const { id, path, media } = user
    
    const fileGroups = chunk(media, 10)

    fileGroups.forEach((fileGroup, i) => {
        
        const modelPost = new Post(user, `:${i}`)

        fileGroup.forEach(media => {

            media.ownerId = modelPost.id

            if (!modelPost.thumb) modelPost.thumb = media.isVideo ? `t:${media.id}` : `m:${media.id}`

            medias.push(media)

        })

        if (!user.picture) user.picture = modelPost.thumb

        posts.push(modelPost)

    })

}

const models = {
    rootCollection: Object.values(rootCollections),
    collection: Object.values(collections),
    user: Object.values(users),
    tag: Object.values(tags),

    post: posts,
    media: medias,
    mediaTag: mediaTags
}
// console.table(posts)
for (const model in models) {
    
    const DBmodels = await prisma[model].findMany({select: {id: true}})
    const DBmodelsIds = arrayColumn(DBmodels, "id")

    const newModels = models[model].filter(({ id }) => !DBmodelsIds.includes(id))
    console.log(`New ${model}:`, newModels.length)

    await prisma[model].createMany({
        data: newModels 
    })

}
// const getChildren = (dir, items) => group(items, ({ path }) => dir + "/" + path.replace(dir + "/", "").split("/").shift())

// const collections = getChildren(rootDir, DBfiles)
// console.log(DBfiles.pop())

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
