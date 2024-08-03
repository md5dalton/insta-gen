import prisma from "@/utils/prisma"
import fs from "fs"

export async function GET(request, { params: { slug } }) {

    // const media = await prisma.media.findUnique({
    //     where: {
    //         id: slug
    //     },
    //     include: {
    //         owner: {
    //             include: {
    //                 owner: {
    //                     include: {
    //                         owner: {
    //                             include: {
    //                                 owner: true
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // })

    // if (media) {
        // const post = media.owner
        // const user = post.owner
        // const collection = user.owner
        // const rootCollection = collection.owner

        // const imagePath = process.env.MEDIA_ROOT + rootCollection.path + collection.path + user.path + post.path.split("<").shift() + media.path
        const imagePath = "/media/1.jpg" 
        return fs.existsSync(imagePath) ? new Response(fs.readFileSync(imagePath), {
                headers: {"Content-Type": "image/jpeg"},
                status: 200
        }) : new Response('Image not found', { status: 404 })

    // } else return new Response('Media not found', { status: 404 })

}