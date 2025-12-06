import * as path from "path"
import * as fs from "fs"
import { MediaType } from "@/types/type"
import { scannerServiceInstance } from "./scanner.service"
import { homedir } from "os"

// This is a workaround to ensure the scanner runs only once in dev mode with hot-reloading
declare global {
    var servicesInitialized: boolean
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