export enum MediaType {
    IMAGE = "IMAGE",
    VIDEO = "VIDEO"
}
export interface VideoMetadata {
    width: number
    height: number
    duration: string
    bitrate: string
}

export type ParamsPage = {
    params: Promise<{ page: number }>
}

export type ParamsSlug = {
    params: Promise<{ slug: string }>
}
export interface ParamsIdPage {
    params: Promise<{ id: string, page: number }>
}