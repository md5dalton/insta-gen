import { existsSync, mkdirSync } from "fs"
import { homedir } from "os"
import path from "path"

export const MEDIA_ROOT = process.env.MEDIA_ROOT ?
    path.join(homedir(), process.env.MEDIA_ROOT) :
    path.join(process.cwd(), "media")
export const THUMB_ROOT = path.join(process.cwd(),"public", "images", "thumbs")


if (!existsSync(MEDIA_ROOT)) mkdirSync(MEDIA_ROOT, { recursive: true })
if (!existsSync(THUMB_ROOT)) mkdirSync(THUMB_ROOT, { recursive: true })