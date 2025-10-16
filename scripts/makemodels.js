import { PrismaClient } from "@prisma/client"
import { arrayColumn, chunk, encode, getMediaDir, group, isVideo, sortChunk } from "../utils/functions.js"

const prisma = new PrismaClient()

const DBfiles = await prisma.file.findMany()
console.log("Found in database: ",  DBfiles.length)

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
    
    // const fileGroups = chunk(media, 10)
    const fileGroups = sortChunk(media, 10, ({ isVideo }) => isVideo)
    
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

for (const model in models) {
    
    const DBmodels = await prisma[model].findMany({select: {id: true}})
    const DBmodelsIds = arrayColumn(DBmodels, "id")

    const newModels = models[model].filter(({ id }) => !DBmodelsIds.includes(id))
    console.log(`New ${model}:`, newModels.length)

    await prisma[model].createMany({
        data: newModels 
    })

}
// console.table(models.media)