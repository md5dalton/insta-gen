import * as path from "path"
import * as fs from "fs"
import { MediaType } from "@/types/type"
import { scannerServiceInstance } from "./scanner.service"
import { homedir } from "os"

// This is a workaround to ensure the scanner runs only once in dev mode with hot-reloading
declare global {
    var servicesInitialized: boolean
}

const MEDIA_ROOT = process.env.MEDIA_ROOT

const mediaLibraryPath = MEDIA_ROOT ? path.join(homedir(), MEDIA_ROOT) : path.join(process.cwd(), "media-library")

const watchFolders = (path: string, type: MediaType) => {

    if (!fs.existsSync(path)) {
        console.log(`Creating media library directory at: ${path}`)
        fs.mkdirSync(path, { recursive: true })
    }

    scannerServiceInstance.startScanner(path, type)
    console.log("Services initialized and scanner started.")
    console.log("You can now add video files to the " + path + " folder in your project root.")
}

export const initializeServices = () => {
    if (process.env.NODE_ENV === "development") {
        if (global.servicesInitialized) return
        
        global.servicesInitialized = true
    }
  
    console.log("Initializing services...")

    const MOVIE_DIR = path.join(mediaLibraryPath, "Movie")
    const TV_DIR = path.join(mediaLibraryPath, "TV")

    console.log(homedir())
    watchFolders(MOVIE_DIR, MediaType.Movie)
    watchFolders(TV_DIR, MediaType.TV)
}