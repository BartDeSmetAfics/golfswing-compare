import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUploadUrl, swingFrameKey } from "@/lib/storage";
import type { SwingPhase, CameraAngle } from "@/lib/constants";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ swingId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { swingId } = await params;
  const swing = await prisma.swing.findFirst({
    where: { id: swingId, userId: session.user.id },
  });
  if (!swing) return Response.json({ error: "Not found" }, { status: 404 });

  const cameraAngle = (req.nextUrl.searchParams.get("cameraAngle") ?? "FACE_ON") as CameraAngle;

  const phases: SwingPhase[] = [
    "ADDRESS",
    "TAKEAWAY",
    "TOP_OF_BACKSWING",
    "DOWNSWING_TRANSITION",
    "IMPACT",
    "FOLLOW_THROUGH",
  ];

  const uploadUrls: Record<string, string> = {};
  for (const phase of phases) {
    const key = swingFrameKey(session.user.id, swingId, phase, cameraAngle);
    uploadUrls[phase] = await getUploadUrl(key, "image/jpeg");
  }

  return Response.json({ uploadUrls });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ swingId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { swingId } = await params;
  const swing = await prisma.swing.findFirst({
    where: { id: swingId, userId: session.user.id },
  });
  if (!swing) return Response.json({ error: "Not found" }, { status: 404 });

  const frames: Array<{
    phase: SwingPhase;
    cameraAngle: CameraAngle;
    timestampMs: number;
    confidence: number;
  }> = await request.json();

  await prisma.swing.update({
    where: { id: swingId },
    data: { status: "PROCESSING" },
  });

  for (const frame of frames) {
    const angle = frame.cameraAngle ?? "FACE_ON";
    const key = swingFrameKey(session.user.id, swingId, frame.phase, angle);
    await prisma.swingFrame.upsert({
      where: { swingId_phase_cameraAngle: { swingId, phase: frame.phase, cameraAngle: angle } },
      update: { timestampMs: frame.timestampMs, imageKey: key, confidence: frame.confidence },
      create: {
        swingId,
        phase: frame.phase,
        cameraAngle: angle,
        timestampMs: frame.timestampMs,
        imageKey: key,
        confidence: frame.confidence,
      },
    });
  }

  // Mark as PROCESSED only when at least one angle is complete
  await prisma.swing.update({
    where: { id: swingId },
    data: { status: "PROCESSED" },
  });

  return Response.json({ ok: true });
}
