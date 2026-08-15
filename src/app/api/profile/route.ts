import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      handicap: true,
      createdAt: true,
      swings: {
        orderBy: { createdAt: "desc" },
        select: { id: true, clubType: true, status: true, createdAt: true },
      },
    },
  });

  return Response.json(user);
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { name?: string; handicap?: number | null };

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.handicap !== undefined && { handicap: body.handicap }),
    },
    select: { id: true, name: true, email: true, handicap: true },
  });

  return Response.json(user);
}
