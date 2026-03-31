import { getRandom, MediaResponse } from "@/actions/explore"
import { MediaType } from "@/prisma/generated/enums"

export const GET = async () => {

    const images = await getRandom(8, MediaType.IMAGE)
    const videos = await getRandom(2, MediaType.VIDEO)
    
    const media: MediaResponse[] = []
    let imageIndex = 0
    let videoIndex = 0
    
    // Process images and insert videos between pairs
    while (imageIndex < images.length) {
        // Add 2 images as separate items
        media.push(images[imageIndex])
        
        if (imageIndex + 1 < images.length) media.push(images[imageIndex + 1])
        
        imageIndex += 2
        
        // Insert video after every 2 images (except at the end)
        if (videoIndex < videos.length && imageIndex < images.length) {
            media.push(videos[videoIndex])
            videoIndex++
        }
    }
    
    return Response.json({
        items: media.map(({ type, ...i }) => ({
            ...i,
            isReel: type === MediaType.VIDEO
        })),
        nextCursor:
            media.length === 10
                ? media[media.length - 1].id
                : null,
    })

}