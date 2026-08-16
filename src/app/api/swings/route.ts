import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { swingVideoKey, getUploadUrl } from "@/lib/storage";

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

  try {
    const { clubType = "IRON", videoMimeType = "video/webm" } = await request.json();

    const extMap: Record<string, string> = {
      "video/webm": "webm",
      "video/mp4": "mp4",
      "video/quicktime": "mov",
    };
    const ext = extMap[videoMimeType] ?? "mp4";

    const swing = await prisma.swing.create({
      data: { userId: session.user.id, clubType, videoKey: "" },
      select: { id: true },
    });

    const key = swingVideoKey(session.user.id, swing.id, ext);
    await prisma.swing.update({ where: { id: swing.id }, data: { videoKey: key } });

    // Return a presigned URL so the client uploads directly to R2 (avoids server body limits)
    const videoUploadUrl = await getUploadUrl(key, videoMimeType);

    return Response.json({ swingId: swing.id, videoUploadUrl }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/swings]", err);
    return Response.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
