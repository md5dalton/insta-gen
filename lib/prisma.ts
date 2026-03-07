import { PrismaClient } from "@/prisma/generated/client"
import { PrismaPg } from "@prisma/adapter-pg"
import prismaRandom from "prisma-extension-random"

const globalThis = global as unknown as { prisma: PrismaClient }

const adapter = new PrismaPg({ connectionString: `${process.env.DATABASE_URL}` })
const prisma = globalThis.prisma || new PrismaClient({ adapter }).$extends(prismaRandom())

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma

export default prisma