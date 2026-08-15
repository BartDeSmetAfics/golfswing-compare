import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUploadUrl, proReferenceKey } from "@/lib/storage";
import type { SwingPhase } from "@/lib/constants";

function isAdmin(email: string) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());
  return adminEmails.includes(email);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { proId, clubType, phase, sourceNote } = await request.json();
  if (!proId || !clubType || !phase) {
    return Response.json({ error: "proId, clubType and phase required" }, { status: 400 });
  }

  const pro = await prisma.pro.findUnique({ where: { id: proId } });
  if (!pro) return Response.json({ error: "Pro not found" }, { status: 404 });

  const key = proReferenceKey(pro.slug, clubType, phase as SwingPhase);
  const uploadUrl = await getUploadUrl(key, "image/jpeg");

  await prisma.proReferenceFrame.upsert({
    where: { proId_clubType_phase: { proId, clubType, phase } },
    update: { imageKey: key, sourceNote },
    create: { proId, clubType, phase, imageKey: key, sourceNote },
  });

  return Response.json({ uploadUrl, key }, { status: 201 });
}
