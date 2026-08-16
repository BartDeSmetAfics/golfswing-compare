import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDownloadUrl } from "@/lib/storage";
import { analyzeSwing } from "@/lib/claude";
import type { SwingPhase } from "@/lib/constants";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ swingId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { swingId } = await params;
    const { proId, cameraAngle = "FACE_ON" } = await request.json();

    const [swing, user] = await Promise.all([
      prisma.swing.findFirst({
        where: { id: swingId, userId: session.user.id },
        include: { frames: true },
      }),
      prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } }),
    ]);
    if (!swing) return Response.json({ error: "Swing not found" }, { status: 404 });

    // Use first name only; fall back to "jij" if name is not set
    const firstName = user?.name?.split(" ")[0] ?? null;

    const pro = await prisma.pro.findUnique({ where: { id: proId } });
    if (!pro) return Response.json({ error: "Pro not found" }, { status: 404 });

    const refFrames = await prisma.proReferenceFrame.findMany({
      where: { proId, clubType: swing.clubType, cameraAngle },
    });

    if (refFrames.length < 6) {
      return Response.json(
        { error: "Not all reference frames are available for this pro and angle" },
        { status: 400 }
      );
    }

    const phaseOrder: SwingPhase[] = [
      "ADDRESS",
      "TAKEAWAY",
      "TOP_OF_BACKSWING",
      "DOWNSWING_TRANSITION",
      "IMPACT",
      "FOLLOW_THROUGH",
    ];

    const framePairs = await Promise.all(
      phaseOrder.map(async (phase) => {
        const userFrame = swing.frames.find((f) => f.phase === phase && f.cameraAngle === cameraAngle);
        const proFrame = refFrames.find((f) => f.phase === phase);
        if (!userFrame || !proFrame) throw new Error(`Missing frame for phase ${phase}`);

        const [userImageUrl, proImageUrl] = await Promise.all([
          getDownloadUrl(userFrame.imageKey, 600),
          getDownloadUrl(proFrame.imageKey, 600),
        ]);

        return { phase, userImageUrl, proImageUrl };
      })
    );

    const result = await analyzeSwing(framePairs, pro.name, firstName);

    const analysis = await prisma.analysis.create({
      data: {
        swingId,
        proId,
        model: "claude-sonnet-4-6",
        overallSummary: result.overall_summary,
        result: result as object,
      },
      include: { pro: true },
    });

    return Response.json(analysis);
  } catch (err) {
    console.error("[analyze] error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
