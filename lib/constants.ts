import { homedir } from "os"
import path from "path"

export const MEDIA_ROOT = process.env.MEDIA_ROOT ?
    path.join(homedir(), process.env.MEDIA_ROOT) :
    path.join(process.cwd(), "media")