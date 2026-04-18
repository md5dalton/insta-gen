import { getTags } from "@/actions/user"
import { Tag } from "@/prisma/generated/client"
import { ParamsId } from "@/types/type"
import { NextRequest } from "next/server"

export const GET = async (req: NextRequest, { params }: ParamsId) => {

    const { 
        id
    } = await params

    const searchParams = req.nextUrl.searchParams

    const cursor = searchParams.get("cursor")

    let items: Pick<Tag, "id" | "name">[] = []

    items = await getTags(id, cursor as string)

    return Response.json({
        items,
        nextCursor:
            items.length === 10
                ? items[items.length - 1].id
                : null,
    })

}