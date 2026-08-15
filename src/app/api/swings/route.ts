import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUploadUrl, swingVideoKey } from "@/lib/storage";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const swings = await prisma.swing.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, clubType: true, status: true, createdAt: true },
  });

  return Response.json(swings);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { clubType = "IRON" } = await request.json();

  const swing = await prisma.swing.create({
    data: { userId: session.user.id, clubType, videoKey: "" },
    select: { id: true },
  });

  const key = swingVideoKey(session.user.id, swing.id);
  await prisma.swing.update({ where: { id: swing.id }, data: { videoKey: key } });

  const uploadUrl = await getUploadUrl(key, "video/webm");

  return Response.json({ swingId: swing.id, uploadUrl }, { status: 201 });
}
