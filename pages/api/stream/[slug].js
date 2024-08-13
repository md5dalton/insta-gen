import { getMedia } from "@/actions/media"
import fs from "fs"
import parseRange from "range-parser"

export default async (req, res) => {
  const { slug } = req.query

    const media = await getMedia(slug)

    console.log(media)
    if (!media) return res.status(404).send("Media not found")
    const videoPath = media.path
    
    if (!fs.existsSync(videoPath)) return res.status(404).send("Video not found")

    const stat = fs.statSync(videoPath)
    const fileSize = stat.size
    const range = req.headers.range || "bytes=0-"

    const parsedRange = parseRange(fileSize, range, { combine: true })

    if (!parsedRange || parsedRange === -1 || parsedRange.type !== "bytes") {
        res.status(400).send("Invalid Range")
        return
    }

    const { start, end } = parsedRange[0]
    const chunkSize = end - start + 1

    const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "video/mp4",
    }

    res.writeHead(206, head)
    fs.createReadStream(videoPath, { start, end }).pipe(res)

}
