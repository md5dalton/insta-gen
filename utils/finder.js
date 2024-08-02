import fs from "fs/promises"
import path from "path"

export const find = async (directory, fileExtensions) => {
  
    const matchingFiles = []

    const extensions = fileExtensions.map(ext => "." + ext)

    const findFiles = async dir => {

        const files = await fs.readdir(dir)

        await Promise.all(
            files.map(async (file) => {
                const filePath = path.join(dir, file).replaceAll(path.sep, "/")
                const stats = await fs.stat(filePath)

                if (stats.isDirectory()) {
                    await findFiles(filePath)
                } else {
                    const fileExtension = path.extname(file).toLowerCase()
                    if (extensions.includes(fileExtension)) matchingFiles.push(filePath)
                }
            })
        )
    } 

    await findFiles(directory)
    return matchingFiles
}
