"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProSelector from "@/components/ProSelector";
import SwingPhaseComparison from "@/components/SwingPhaseComparison";
import CoachingFeedback from "@/components/CoachingFeedback";
import AppHeader from "@/components/AppHeader";
import type { SwingPhase } from "@/lib/constants";
import { SWING_PHASES } from "@/lib/constants";

interface SwingFrame {
  phase: SwingPhase;
  imageUrl: string;
  timestampMs: number;
}

interface Swing {
  id: string;
  clubType: string;
  status: string;
  frames: SwingFrame[];
}

interface ProReferenceFrame {
  phase: SwingPhase;
  imageUrl: string;
}

export default function SwingDetailPage() {
  const { swingId } = useParams<{ swingId: string }>();
  const [swing, setSwing] = useState<Swing | null>(null);
  const [selectedProId, setSelectedProId] = useState<string | null>(null);
  const [selectedProName, setSelectedProName] = useState<string>("");
  const [proFrames, setProFrames] = useState<ProReferenceFrame[]>([]);
  const [loading, setLoading] = useState(true);
  const [proLoading, setProLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/swings/${swingId}`)
      .then((r) => r.json())
      .then((data: Swing) => { setSwing(data); setLoading(false); });
  }, [swingId]);

  async function handleProSelect(proId: string) {
    setSelectedProId(proId);
    setProLoading(true);

    const [prosRes, framesRes] = await Promise.all([
      fetch("/api/pros"),
      fetch(`/api/pros/${proId}?clubType=${swing?.clubType ?? "IRON"}`),
    ]);
    const pros = await prosRes.json() as Array<{ id: string; name: string }>;
    const frames = await framesRes.json() as ProReferenceFrame[];

    const pro = pros.find((p) => p.id === proId);
    setSelectedProName(pro?.name ?? "Pro");
    setProFrames(frames);
    setProLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-green-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!swing) {
    return (
      <main className="min-h-screen bg-green-950 text-white p-6 flex items-center justify-center">
        <p>Swing not found.</p>
      </main>
    );
  }

  const pairedFrames = SWING_PHASES.filter((phase) => {
    const userFrame = swing.frames.find((f) => f.phase === phase);
    const proFrame = proFrames.find((f) => f.phase === phase);
    return userFrame && proFrame;
  }).map((phase) => ({
    phase,
    userImageUrl: swing.frames.find((f) => f.phase === phase)!.imageUrl,
    proImageUrl: proFrames.find((f) => f.phase === phase)!.imageUrl,
    proName: selectedProName,
  }));

  return (
    <main className="min-h-screen bg-green-950 text-white p-6 pb-16">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <AppHeader backHref="/" backLabel="Dashboard" title={`${swing.clubType.toLowerCase()} swing`} />

        {swing.status !== "PROCESSED" ? (
          <p className="text-yellow-400 text-sm">
            Swing is still being processed — check back in a moment.
          </p>
        ) : (
          <>
            <ProSelector selected={selectedProId} onSelect={handleProSelect} />

            {proLoading && (
              <div className="flex items-center justify-center py-6">
                <div className="w-6 h-6 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!proLoading && pairedFrames.length > 0 && (
              <>
                <SwingPhaseComparison pairs={pairedFrames} />
                <CoachingFeedback
                  swingId={swingId}
                  proId={selectedProId!}
                />
              </>
            )}

            {!proLoading && selectedProId && pairedFrames.length === 0 && (
              <p className="text-yellow-400 text-sm">
                No reference frames found for this pro yet. Upload them in the admin panel.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
