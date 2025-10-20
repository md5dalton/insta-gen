import { getThumsDir } from "@/utils/functions"
import fs from "fs"

export async function GET(req, props) {
    const params = await props.params;

    const {
        slug
    } = params;

    const imagePath = `${getThumsDir()}/${slug}.jpg`

    return fs.existsSync(imagePath) ? new Response(fs.readFileSync(imagePath), {
            headers: {"Content-Type": "image/jpeg"},
            status: 200
    }) : new Response('Image not found', { status: 404 })
}