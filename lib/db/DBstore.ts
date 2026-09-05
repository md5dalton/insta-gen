import { PrismaClient } from "@/prisma/generated/client"
import prisma from "../prisma"

class DBstore {
    private prisma: PrismaClient
    
    constructor() {
        this.prisma = prisma
        
    }
}

export const db = new DBstore()