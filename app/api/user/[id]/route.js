import { getPosts, getVideos } from "@/actions/random"

export async function GET(req, { params: { page } }) {

    return Response.json({
        media: media,
        page,
        end: false
    })

}