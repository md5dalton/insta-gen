import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const count = await prisma.profileUser.count()
    return NextResponse.json({ exists: count > 0 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ exists: true })
  }
}
