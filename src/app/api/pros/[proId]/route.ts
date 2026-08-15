import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDownloadUrl } from "@/lib/storage";
import type { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ proId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { proId } = await params;
  const clubType = request.nextUrl.searchParams.get("clubType") ?? "IRON";

  const frames = await prisma.proReferenceFrame.findMany({
    where: { proId, clubType: clubType as "IRON" },
    orderBy: { phase: "asc" },
  });

  const framesWithUrls = await Promise.all(
    frames.map(async (f) => ({
      ...f,
      imageUrl: await getDownloadUrl(f.imageKey),
    }))
  );

  return Response.json(framesWithUrls);
}
