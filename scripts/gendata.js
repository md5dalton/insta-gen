import { PrismaClient } from "@prisma/client"
import { arrayColumn, arrayDiff, chunk, encode, group, isVideo } from "../utils/functions.js"

class Image
{
    #items = []
    #newItems = []
    #db = []

    #data
    #prisma

    constructor () {

        this.#prisma = new PrismaClient()

    }

    async getMetadata () {

        await Promise.all(
            this.#newItems.map(async item => {
                
                const { path } = this.#items.filter(({ id }) => item == id)

                const { birthtime } = await fs.stat(path)
                
                const { height, width } = await sharp(path).metadata()

                const model = {
                    id: item,
                    height,
                    width,
                    mktime: birthtime,
                    portrait: height > width,
                    mediaImage: ownerId
                }

                this.#data.push(model)

            })

        )
        

        return {
            birthtime,
            height,
            width,
        }

    }

    async getItems () {

        this.#items = await this.#prisma.media.findMany({
            where: {
                type: "IMAGE"
            },
            select: {
                path: true,
                id: true,
                ownerId: true
            }
        })
        
    }

    async addToDB () {

        await this.getItems()
        console.log("Existing", this.#items.length)

        this.#db = await this.#prisma.image.findMany({select: {id: true}})

        const ids = arrayColumn(this.#db, "id")

        this.#newItems = arrayDiff(this.#items, ids)
        console.log("New", this.#newItems.length)

        await this.getMetadata()

        await prisma.image.createMany({
            data: this.#data
        })
    }
}

const generator = new Image()

await generator.addToDB()