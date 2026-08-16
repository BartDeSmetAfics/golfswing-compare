"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProSelector from "@/components/ProSelector";
import SwingPhaseComparison from "@/components/SwingPhaseComparison";
import CoachingFeedback from "@/components/CoachingFeedback";
import AppHeader from "@/components/AppHeader";
import type { SwingPhase, CameraAngle } from "@/lib/constants";
import { SWING_PHASES, CAMERA_ANGLES, CAMERA_ANGLE_LABELS } from "@/lib/constants";

interface SwingFrame {
  phase: SwingPhase;
  cameraAngle: CameraAngle;
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
  cameraAngle: CameraAngle;
  imageUrl: string;
}

export default function SwingDetailPage() {
  const { swingId } = useParams<{ swingId: string }>();
  const [swing, setSwing] = useState<Swing | null>(null);
  const [selectedProId, setSelectedProId] = useState<string | null>(null);
  const [selectedProName, setSelectedProName] = useState<string>("");
  const [proFrames, setProFrames] = useState<ProReferenceFrame[]>([]);
  const [selectedAngle, setSelectedAngle] = useState<CameraAngle>("FACE_ON");
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
      fetch(`/api/pros/${proId}?clubType=${swing?.clubType ?? "IRON"}&cameraAngle=${selectedAngle}`),
    ]);
    const pros = await prosRes.json() as Array<{ id: string; name: string }>;
    const frames = await framesRes.json() as ProReferenceFrame[];

    const pro = pros.find((p) => p.id === proId);
    setSelectedProName(pro?.name ?? "Pro");
    setProFrames(frames);
    setProLoading(false);
  }

  // When angle changes, reload pro frames for the new angle
  useEffect(() => {
    if (!selectedProId || !swing) return;
    setProLoading(true);
    fetch(`/api/pros/${selectedProId}?clubType=${swing.clubType}&cameraAngle=${selectedAngle}`)
      .then((r) => r.json())
      .then((frames: ProReferenceFrame[]) => { setProFrames(frames); setProLoading(false); });
  }, [selectedAngle]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <p>Swing niet gevonden.</p>
      </main>
    );
  }

  // Which angles does this swing have frames for?
  const availableAngles = CAMERA_ANGLES.filter((angle) =>
    swing.frames.some((f) => f.cameraAngle === angle)
  );

  // Filter user frames by selected angle
  const userFramesForAngle = swing.frames.filter((f) => f.cameraAngle === selectedAngle);

  const pairedFrames = SWING_PHASES.filter((phase) => {
    const userFrame = userFramesForAngle.find((f) => f.phase === phase);
    const proFrame = proFrames.find((f) => f.phase === phase);
    return userFrame && proFrame;
  }).map((phase) => ({
    phase,
    userImageUrl: userFramesForAngle.find((f) => f.phase === phase)!.imageUrl,
    proImageUrl: proFrames.find((f) => f.phase === phase)!.imageUrl,
    proName: selectedProName,
  }));

  // Which angle is missing for this swing?
  const missingAngle = CAMERA_ANGLES.find((a) => !availableAngles.includes(a));

  return (
    <main className="min-h-screen bg-green-950 text-white p-6 pb-16">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <AppHeader backHref="/" backLabel="Dashboard" title={`${swing.clubType.toLowerCase()} swing`} />

        {swing.status !== "PROCESSED" ? (
          <p className="text-yellow-400 text-sm">
            Swing wordt nog verwerkt — kom zo terug.
          </p>
        ) : (
          <>
            {/* Angle tabs — always visible */}
            <div className="flex flex-col gap-2">
              <div className="flex rounded-xl overflow-hidden border border-green-800">
                {CAMERA_ANGLES.map((angle) => (
                  <button
                    key={angle}
                    onClick={() => setSelectedAngle(angle)}
                    className={`flex-1 py-2 text-xs font-medium transition-colors ${
                      selectedAngle === angle
                        ? "bg-green-600 text-white"
                        : "bg-green-900/40 text-green-300 hover:bg-green-900"
                    }`}
                  >
                    {angle === "FACE_ON" ? "🎯 Tegenover" : "🎬 Van achter"}
                  </button>
                ))}
              </div>

              {/* Prompt to add this angle if user doesn't have it yet */}
              {missingAngle === selectedAngle && (
                <Link
                  href={`/record?swingId=${swingId}&angle=${selectedAngle}`}
                  className="flex items-center justify-center gap-2 border border-dashed border-green-700 rounded-xl py-2 text-sm text-green-400 hover:text-green-200 hover:border-green-500 transition"
                >
                  <span>+</span>
                  <span>Voeg jouw {selectedAngle === "FACE_ON" ? "tegenover" : "van achter"} video toe</span>
                </Link>
              )}
            </div>

            <ProSelector selected={selectedProId} onSelect={handleProSelect} />

            {proLoading && (
              <div className="flex items-center justify-center py-6">
                <div className="w-6 h-6 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!proLoading && pairedFrames.length > 0 && (
              <>
                <SwingPhaseComparison pairs={pairedFrames} />
                <CoachingFeedback swingId={swingId} proId={selectedProId!} cameraAngle={selectedAngle} />
              </>
            )}

            {!proLoading && selectedProId && pairedFrames.length === 0 && (
              <div className="bg-green-900/40 rounded-xl p-4 text-sm text-green-300 flex flex-col gap-2">
                {proFrames.length === 0 ? (
                  <p>Geen {selectedAngle === "FACE_ON" ? "tegenover" : "van-achter"} referentieframes voor deze pro — nog niet geseeded.</p>
                ) : (
                  <>
                    <p>Je hebt nog geen video geüpload van {selectedAngle === "FACE_ON" ? "tegenover" : "van achter"}.</p>
                    <Link
                      href={`/record?swingId=${swingId}&angle=${selectedAngle}`}
                      className="text-green-400 underline hover:text-green-200"
                    >
                      + Video toevoegen →
                    </Link>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
