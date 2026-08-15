import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadBuffer } from "@/lib/storage";

export const maxDuration = 120;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ swingId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { swingId } = await params;

  const swing = await prisma.swing.findUnique({
    where: { id: swingId, userId: session.user.id },
    select: { videoKey: true },
  });
  if (!swing) return Response.json({ error: "Not found" }, { status: 404 });

  try {
    const contentType = request.headers.get("content-type") ?? "video/mp4";
    const buffer = Buffer.from(await request.arrayBuffer());
    await uploadBuffer(swing.videoKey, buffer, contentType);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[PUT /api/swings/video]", err);
    return Response.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 });
  }
}
