declare enum MediaType {
    IMAGE = "IMAGE",
    VIDEO = "VIDEO"
}
declare interface VideoMetadata {
    width: number
    height: number
    duration: string
    bitrate: string
}

declare interface ParamsPage {
    params: Promise<{ page: number }>
}

declare interface ParamsSlug {
    params: Promise<{ slug: string }>
}

export declare interface ParamsIdPage {
    params: Promise<{ id: string, page: number }>
}

