import { homedir } from "os"
import path from "path"

export const relativePath = (absolutePath: string): string => absolutePath.replace(homedir(), "")
export const absolutePath = (relativePath: string): string => path.join(homedir(), relativePath)