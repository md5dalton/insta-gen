import { extname } from "node:path"
import { AssetType, MediaType, UserCapability } from "@/prisma/generated/enums"
import { resolveEffectiveAccess } from "@/lib/policy/EffectiveAccess"
import { resolveEffectiveDeletion } from "@/lib/policy/EffectiveDeletion"
import { resolveEffectiveProcessingPolicy } from "@/lib/policy/EffectiveProcessing"
import { EffectiveMedia } from "@/lib/policy/EffectiveMedia"
import { MediaConfig } from "@/lib/config"
import { Storage } from "@/lib/storage"
import prisma from "@/lib/prisma"
import withAuthParams from "@/hooks/withAuthParams"
import { ProfileUser } from "@/types/types"
import { getMedia } from "@/lib/db/effectiveMedia"

const mediaStorage = new Storage(MediaConfig.MEDIA_ROOT)
const assetStorage = new Storage(MediaConfig.ASSETS_ROOT)

const contentTypeByExtension: Record<string, string> = {
    ".avif": "image/avif",
    ".gif": "image/gif",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}

export const GET = withAuthParams<{ slug: string }>(async (req, { params, user }) => {
    const requestedVariant = req.nextUrl.searchParams.get("q")
    if (requestedVariant && !["original", "feed", "thumb"].includes(requestedVariant)) {
        return new Response("Invalid image variant", { status: 400 })
    }

    const media = await getMedia(params.slug)

    if (!media) return new Response("Media not found", { status: 404 })
    if (media.type !== MediaType.IMAGE) return new Response("Image media only", { status: 415 })

    if (resolveEffectiveDeletion(media).isEffectivelyDeleted) {
        return new Response("Media deleted", { status: 404 })
    }

    const access = resolveEffectiveAccess(media, [user])
    
    if (!access.effectiveUsers[0]?.allowed) return new Response("Permission to access resource required", { status: 403 })

    const canDownloadOriginal = user.role === "ADMIN" ||
        user.capability === UserCapability.DOWNLOAD

    const availableAssets = new Map(
        media.assets
            .filter((asset) => asset.status === "READY")
            .map((asset) => [asset.type, asset.path])
    )

    const requiresFeed = resolveEffectiveProcessingPolicy(media).requiredAssets.includes(AssetType.FEED_IMAGE)
    
    const variants = requestedVariant
        ? [requestedVariant]
        : requiresFeed
            ? ["feed", "thumb", ...(canDownloadOriginal ? ["original"] : [])]
            : canDownloadOriginal
                ? ["original"]
                : ["thumb"]
                
    for (const variant of variants) {
        if (variant === "original") {
            if (!canDownloadOriginal) {
                return new Response("Download permission required", { status: 403 })
            }
            
            if (await mediaStorage.exists(media.path)) {
                const stream = await mediaStorage.stream(media.path)
                const contentType = contentTypeByExtension[extname(media.path).toLowerCase()] ?? "application/octet-stream"
                return new Response(stream as unknown as ReadableStream, {
                    headers: { "Content-Type": contentType, "Cache-Control": "private, no-store" },
                })
            }
            continue
        }

        const assetType = variant === "feed" ? AssetType.FEED_IMAGE : AssetType.THUMBNAIL
        const assetPath = availableAssets.get(assetType)
        if (!assetPath || !(await assetStorage.exists(assetPath))) continue

        const stream = await assetStorage.stream(assetPath)
        return new Response(stream as unknown as ReadableStream, {
            headers: { "Content-Type": "image/webp", "Cache-Control": "private, no-store" },
        })
    }

    return new Response("Image asset not found", { status: 404 })
})