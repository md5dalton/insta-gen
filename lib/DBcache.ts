import { PrismaClient } from "@/prisma/generated/client"
import prisma from "./prisma"
import { generateId } from "./path"
import { Collection, RootCollection } from "@/prisma/generated/browser"
import { sep } from "node:path"

export class DBcache {
    private prisma: PrismaClient

    private rootCache = new Map<string, any>()
    private collectionCache = new Map<string, any>()
    private userCache = new Map<string, any>()
    private tagCache = new Map<string, any>()

    constructor() {
        this.prisma = prisma
    }

    private async ensureRootCollection(name: string) {
        if (this.rootCache.has(name)) return this.rootCache.get(name)

        const path = `/${name}`
        const id = generateId(path)

        const record = await this.prisma.rootCollection.upsert({
            where: { id },
            update: { path },
            create: { id, path }
        })

        this.rootCache.set(name, record)

        return record
    }

    private async ensureCollection(root: RootCollection, name: string) {
        const key = `${root.id}:${name}`
        if (this.collectionCache.has(key)) return this.collectionCache.get(key)

        const path = `${root.path}/${name}`
        const id = generateId(path)

        const record = await this.prisma.collection.upsert({
            where: { id },
            update: { path },
            create: { id, path, rootCollectionId: root.id }
        })

        this.collectionCache.set(key, record)

        return record
    }

    private async ensureUser(collection: Collection, name: string) {
        const key = `${collection.id}:${name}`
        if (this.userCache.has(key)) return this.userCache.get(key)

        const path = `${collection.path}/${name}`
        const id = generateId(path)

        const record = await this.prisma.mediaUser.upsert({
            where: { id },
            update: { path },
            create: { id, path, collectionId: collection.id }
        })

        this.userCache.set(key, record)

        return record
    }

    async ensureTag(path: string) {
        if (this.tagCache.has(path)) return this.tagCache.get(path)

        const id = generateId(path)
        const name = path.split(sep).pop() || path

        const tag = await this.prisma.tag.upsert({
            where: { id },
            update: { path },
            create: { id, path, name }
        })

        this.tagCache.set(path, tag)

        return tag
    }

    async ensureParents(rootCollection: string, collection: string, user: string) {

        const rootCollectionRecord = await this.ensureRootCollection(rootCollection)
        const collectionRecord = await this.ensureCollection(rootCollectionRecord, collection)
        const userRecord = await this.ensureUser(collectionRecord, user)

        return {
            rootCollection: rootCollectionRecord,
            collection: collectionRecord,
            user: userRecord
        }

    }
    
}