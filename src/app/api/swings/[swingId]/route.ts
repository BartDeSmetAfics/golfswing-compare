import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDownloadUrl, deleteObjects } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ swingId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { swingId } = await params;

    const swing = await prisma.swing.findFirst({
      where: { id: swingId, userId: session.user.id },
      include: {
        frames: { orderBy: { phase: "asc" } },
        analyses: { include: { pro: true }, orderBy: { createdAt: "desc" } },
      },
    });

    if (!swing) return Response.json({ error: "Not found" }, { status: 404 });

    const framesWithUrls = await Promise.all(
      swing.frames.map(async (f) => ({
        ...f,
        imageUrl: await getDownloadUrl(f.imageKey),
      }))
    );

    return Response.json({ ...swing, frames: framesWithUrls });
  } catch (err) {
    console.error("[GET /api/swings/[swingId]]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ swingId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { swingId } = await params;

  const swing = await prisma.swing.findFirst({
    where: { id: swingId, userId: session.user.id },
    include: { frames: { select: { imageKey: true } } },
  });

  if (!swing) return Response.json({ error: "Not found" }, { status: 404 });

  const r2Keys = [swing.videoKey, ...swing.frames.map((f) => f.imageKey)].filter(Boolean);
  await deleteObjects(r2Keys);

  // Delete child records explicitly before deleting the swing
  await prisma.analysis.deleteMany({ where: { swingId } });
  await prisma.swingFrame.deleteMany({ where: { swingId } });
  await prisma.swing.delete({ where: { id: swingId } });

  return Response.json({ success: true });
}
