import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { resolveUserFromRequest } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    await resolveUserFromRequest(req)
    const profiles = await prisma.processingProfile.findMany()
    return NextResponse.json(profiles)
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err?.message || 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: Request) {
  try {
    await resolveUserFromRequest(req)
    const { name, feedImage, hls, lowQuality } = await req.json()
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 64)
    const profile = await prisma.processingProfile.create({ data: { id, name, feedImage: !!feedImage, hls: !!hls, lowQuality: !!lowQuality } })
    return NextResponse.json(profile)
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err?.message || 'Unauthorized' }, { status: 401 })
  }
}
