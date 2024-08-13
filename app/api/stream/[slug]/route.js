import fs from "fs"

export async function GET(req, { params: { slug } }) {

    // const imagePath = `${process.env.THUMB_ROOT}/${slug}.jpg`
    const imagePath = `/media/1.jpg`
    
    return fs.existsSync(imagePath) ? new Response(fs.readFileSync(imagePath), {
            headers: {"Content-Type": "image/jpeg"},
            status: 200
    }) : new Response('Image not found', { status: 404 })

}