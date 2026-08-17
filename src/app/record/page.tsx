"use client";

import { useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CameraRecorder from "@/components/CameraRecorder";
import FrameExtractor from "@/components/FrameExtractor";
import AppHeader from "@/components/AppHeader";
import type { CameraAngle } from "@/lib/constants";
import { CAMERA_ANGLE_LABELS } from "@/lib/constants";

type Mode = "record" | "upload";

function RecordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // If ?swingId=xxx&angle=DOWN_THE_LINE is in the URL, we're adding a second angle
  const existingSwingId = searchParams.get("swingId");
  const forcedAngle = searchParams.get("angle") as CameraAngle | null;

  const [mode, setMode] = useState<Mode>("record");
  const [selectedAngle, setSelectedAngle] = useState<CameraAngle>(forcedAngle ?? "FACE_ON");
  const [angleConfirmed, setAngleConfirmed] = useState(!!forcedAngle || !!existingSwingId);
  const [swingId, setSwingId] = useState<string | null>(existingSwingId);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadVideo = useCallback(async (blob: Blob, mimeType: string) => {
    setUploading(true);
    setError("");

    try {
      let id = swingId;

      if (!id) {
        // Create swing record + get presigned R2 upload URL in one call
        const res = await fetch("/api/swings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clubType: "IRON", videoMimeType: mimeType }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(`Server error ${res.status}: ${body.error ?? "unknown"}`);
        }
        const data = await res.json() as { swingId: string; videoUploadUrl: string };
        id = data.swingId;
        setSwingId(id);

        // Upload video DIRECTLY to R2 — bypasses Next.js body size limits and Railway timeouts
        const uploadRes = await fetch(data.videoUploadUrl, {
          method: "PUT",
          body: blob,
          headers: { "Content-Type": mimeType },
        });
        if (!uploadRes.ok) {
          throw new Error(`Video upload mislukt (${uploadRes.status})`);
        }
      }

      setVideoBlob(blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload mislukt — probeer opnieuw.");
    } finally {
      setUploading(false);
    }
  }, [swingId]);

  const handleRecordingComplete = useCallback((blob: Blob) => {
    uploadVideo(blob, "video/webm");
  }, [uploadVideo]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadVideo(file, file.type || "video/mp4");
  }, [uploadVideo]);

  const handleProgress = useCallback((pct: number, label: string) => {
    setProgress(pct);
    setProgressLabel(label);
  }, []);

  const handleComplete = useCallback(() => {
    router.push(`/swings/${swingId}`);
  }, [router, swingId]);

  const reset = () => {
    if (!existingSwingId) setSwingId(null);
    setVideoBlob(null);
    setProgress(0);
    setProgressLabel("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const angleLabels: Record<CameraAngle, { emoji: string; short: string; desc: string }> = {
    FACE_ON: {
      emoji: "🎯",
      short: "Tegenover (face-on)",
      desc: "Camera staat voor je — je buik en gezicht zijn zichtbaar",
    },
    DOWN_THE_LINE: {
      emoji: "🎬",
      short: "Van achter (down-the-line)",
      desc: "Camera staat achter je — langs de swinglijn",
    },
  };

  const backHref = existingSwingId ? `/swings/${existingSwingId}` : "/";
  const title = existingSwingId
    ? `2e perspectief toevoegen`
    : "Nieuwe ijzerswing";

  return (
    <main className="min-h-screen bg-green-950/75 text-white p-6">
      <div className="max-w-sm mx-auto flex flex-col gap-6">
        <AppHeader backHref={backHref} backLabel={existingSwingId ? "Terug naar swing" : "Dashboard"} title={title} />

        {/* Step 1: choose angle — skip if angle is forced via URL */}
        {!angleConfirmed && (
          <div className="flex flex-col gap-4">
            <p className="text-green-200 text-sm font-medium">Kies het camerastandpunt van je video:</p>
            {(["FACE_ON", "DOWN_THE_LINE"] as CameraAngle[]).map((angle) => {
              const info = angleLabels[angle];
              const isSelected = selectedAngle === angle;
              return (
                <button
                  key={angle}
                  onClick={() => setSelectedAngle(angle)}
                  className={`flex items-start gap-3 rounded-xl p-4 text-left border-2 transition ${
                    isSelected
                      ? "border-green-400 bg-green-800/60"
                      : "border-green-800 bg-green-900/30 hover:border-green-600"
                  }`}
                >
                  <span className="text-2xl">{info.emoji}</span>
                  <div>
                    <p className="font-semibold text-green-100 text-sm">{info.short}</p>
                    <p className="text-green-400 text-xs mt-0.5">{info.desc}</p>
                  </div>
                </button>
              );
            })}
            <button
              onClick={() => setAngleConfirmed(true)}
              className="bg-green-600 hover:bg-green-500 text-white rounded-xl py-3 font-semibold transition"
            >
              Doorgaan →
            </button>
          </div>
        )}

        {/* Step 2: record or upload */}
        {angleConfirmed && !videoBlob && !uploading && (
          <>
            <div className="flex items-center gap-2 bg-green-900/50 rounded-xl px-4 py-2 text-sm text-green-300">
              <span>{angleLabels[selectedAngle].emoji}</span>
              <span>{CAMERA_ANGLE_LABELS[selectedAngle]}</span>
              {!forcedAngle && (
                <button onClick={() => setAngleConfirmed(false)} className="ml-auto text-green-500 hover:text-green-300 text-xs underline">
                  wijzigen
                </button>
              )}
            </div>

            {/* Mode tabs */}
            <div className="flex rounded-xl overflow-hidden border border-green-800">
              <button
                onClick={() => { setMode("record"); reset(); }}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  mode === "record" ? "bg-green-600 text-white" : "bg-green-900/40 text-green-300 hover:bg-green-900"
                }`}
              >
                🎥 Opnemen
              </button>
              <button
                onClick={() => { setMode("upload"); reset(); }}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  mode === "upload" ? "bg-green-600 text-white" : "bg-green-900/40 text-green-300 hover:bg-green-900"
                }`}
              >
                📁 Video uploaden
              </button>
            </div>

            {mode === "record" && (
              <>
                <div className="bg-green-900/50 rounded-xl p-4 flex flex-col gap-1 text-sm text-green-200">
                  <p className="font-semibold text-green-100">Tips voor een goede opname:</p>
                  <p>• Zorg dat je volledige lichaam zichtbaar is</p>
                  <p>• Start de opname, neem <strong>eerst je adresstelling in</strong>, dan sla je</p>
                  <p>• Sla niet voor je op record drukt — begin altijd vanuit rust</p>
                </div>
                <CameraRecorder onRecordingComplete={handleRecordingComplete} />
              </>
            )}

            {mode === "upload" && (
              <>
                <div className="bg-green-900/50 rounded-xl p-4 flex flex-col gap-1 text-sm text-green-200">
                  <p className="font-semibold text-green-100">Tips voor een goede video:</p>
                  <p>• De video moet beginnen vanuit de <strong>adresstelling</strong>, vóór de swing</p>
                  <p>• Zorg dat je volledige lichaam zichtbaar is</p>
                </div>
                <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-green-600 rounded-2xl p-10 text-green-300 hover:border-green-400 hover:text-white transition-colors"
                >
                  <span className="text-4xl">📹</span>
                  <span className="text-sm font-medium">Tik om video te kiezen</span>
                  <span className="text-xs text-green-500">MP4, MOV, WebM</span>
                </button>
              </>
            )}
          </>
        )}

        {/* Uploading spinner */}
        {uploading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-green-300 text-sm">Video uploaden…</p>
          </div>
        )}

        {/* Frame extraction progress */}
        {videoBlob && swingId && (
          <div className="flex flex-col gap-3">
            {progressLabel && (
              <p className="text-green-300 text-sm text-center">{progressLabel}</p>
            )}
            <div className="w-full bg-green-900 rounded-full h-2">
              <div
                className="bg-green-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <FrameExtractor
              videoBlob={videoBlob}
              swingId={swingId}
              cameraAngle={selectedAngle}
              onProgress={handleProgress}
              onComplete={handleComplete}
              onError={setError}
            />
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm text-center bg-red-900/30 rounded-xl p-3">{error}</p>
        )}
      </div>
    </main>
  );
}

export default function RecordPage() {
  return (
    <Suspense>
      <RecordPageInner />
    </Suspense>
  );
}
