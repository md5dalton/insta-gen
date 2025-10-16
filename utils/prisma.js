import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import prismaRandom from "prisma-extension-random"

const connectionString = `${process.env.DATABASE_URL}`

const adapter = new PrismaPg({ connectionString })
const prisma = globalThis.prisma || new PrismaClient({ adapter }).$extends(prismaRandom())

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma

export default prisma