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
    params: Promise<{ page: string }>
}

export type ParamsSlug = {
    params: Promise<{ slug: string }>
}
export interface ParamsIdPage {
    params: Promise<{ id: string, page: string }>
}
export interface ParamsId {
    params: Promise<{ id: string }>
}

export interface File {
    path: string
    id: string
}

export interface Payload {
    file: File
    event: "add" | "change" | "delete"
    userId: string
    tags: string[]
}