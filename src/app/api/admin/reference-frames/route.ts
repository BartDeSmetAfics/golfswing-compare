import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadBuffer, proReferenceKey } from "@/lib/storage";
import type { SwingPhase } from "@/lib/constants";

export async function GET(request: NextRequest) {
  if (!checkAdminKey(request)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const pros = await prisma.pro.findMany({ select: { id: true, name: true, slug: true } });
  return Response.json(pros);
}

function isAdmin(email: string) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

function checkAdminKey(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return request.headers.get("x-admin-key") === secret;
}

export async function POST(request: NextRequest) {
  const hasAdminKey = checkAdminKey(request);
  if (!hasAdminKey) {
    const session = await auth();
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const formData = await request.formData();
  const proId = formData.get("proId") as string;
  const clubType = formData.get("clubType") as string;
  const phase = formData.get("phase") as string;
  const sourceNote = (formData.get("sourceNote") as string) ?? "";
  const image = formData.get("image") as File | null;

  if (!proId || !clubType || !phase || !image) {
    return Response.json({ error: "proId, clubType, phase and image required" }, { status: 400 });
  }

  const pro = await prisma.pro.findUnique({ where: { id: proId } });
  if (!pro) return Response.json({ error: "Pro not found" }, { status: 404 });

  try {
    const key = proReferenceKey(pro.slug, clubType, phase as SwingPhase);
    const buffer = Buffer.from(await image.arrayBuffer());
    await uploadBuffer(key, buffer, image.type || "image/jpeg");

    await prisma.proReferenceFrame.upsert({
      where: { proId_clubType_phase: { proId, clubType, phase } },
      update: { imageKey: key, sourceNote },
      create: { proId, clubType, phase, imageKey: key, sourceNote },
    });

    return Response.json({ ok: true, key }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/reference-frames]", err);
    return Response.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 });
  }
}
