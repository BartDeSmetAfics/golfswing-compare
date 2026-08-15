import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const pros = await prisma.pro.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return Response.json(pros);
}
