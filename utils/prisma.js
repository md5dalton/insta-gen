import { PrismaClient } from "@prisma/client"
import prismaRandom from "prisma-extension-random"

const prisma = globalThis.prisma || new PrismaClient().$extends(prismaRandom())

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma

export default prisma