import prisma from "@/lib/prisma"
import { AssetStatus, AssetType } from "@/prisma/generated/enums"

export async function updateMediaAsset(mediaId: string, path: string, type: AssetType, status: AssetStatus = AssetStatus.READY) {
    try {
        await prisma.mediaAsset.upsert({
            where: { mediaId_type: { mediaId, type } },
            update: { status },
            create: { mediaId, type, status, path },
        })
        return true
    } catch (e) {
        return false
    }
}