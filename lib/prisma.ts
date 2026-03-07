import { PrismaClient } from "@/prisma/generated/client"
import { PrismaPg } from "@prisma/adapter-pg"
// import prismaRandom from "prisma-extension-random"

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
})

const prisma =
    globalForPrisma.prisma ??
    // new PrismaClient({ adapter }).$extends(prismaRandom())
    new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma