import { ProcessingProfile } from "@/types/types"

export const processingProfile: ProcessingProfile = {
    id: "default-profile",
    name: "Default",
    description: "Standard storage with required thumbnail. No additional transcode renditions.",
    isSystem: true,
    renditions: ["THUMBNAIL"],
}