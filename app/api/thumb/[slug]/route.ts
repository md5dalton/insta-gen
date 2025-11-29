import { getThumsDir } from "@/utils/functions"
import fs from "fs"
import { NextRequest } from "next/server"

interface Params {
    slug: string
}

export async function GET(
    req: NextRequest,
    props: { params: Promise<Params> }
): Promise<Response> {
    const { slug } = await props.params

    const imagePath = `${getThumsDir()}/${slug}.jpg`

    if (fs.existsSync(imagePath)) {
        const buffer = fs.readFileSync(imagePath)

        return new Response(new Uint8Array(buffer), {
            headers: { "Content-Type": "image/jpeg" },
        })
        // return new Response(buffer, {
        //     headers: { "Content-Type": "image/jpeg" },
        //     status: 200,
        // })
    }

    return new Response("Image not found", { status: 404 })
}
