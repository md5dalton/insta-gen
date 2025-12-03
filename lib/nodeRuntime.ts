
export const generateId = async (path: string) => {
        
    const crypto = await import("crypto")
    
    const hash = crypto.createHash("sha256").update(path).digest("hex")

    const base64Hash = Buffer.from(hash, "hex").toString("base64")

    return base64Hash.replace(/[^a-zA-Z0-9]/g, "").substring(0, 8)
        
}