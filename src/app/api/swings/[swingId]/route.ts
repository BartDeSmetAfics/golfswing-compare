import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDownloadUrl } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ swingId: string }> }
) {
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
}
