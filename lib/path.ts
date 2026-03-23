import crypto from "crypto"

export const generateId = (path: string): string => {
    const hash = crypto.createHash("sha256").update(path).digest("hex")
    
    return Buffer.from(hash, "hex")
            .toString("base64")
            .replace(/[^a-zA-Z0-9]/g, "")
            .substring(0, 8)
}