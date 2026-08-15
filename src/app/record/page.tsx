"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import CameraRecorder from "@/components/CameraRecorder";
import FrameExtractor from "@/components/FrameExtractor";

export default function RecordPage() {
  const router = useRouter();
  const [swingId, setSwingId] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleRecordingComplete = useCallback(async (blob: Blob) => {
    setUploading(true);
    setError("");

    try {
      // Create swing + get presigned upload URL for the video
      const res = await fetch("/api/swings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubType: "IRON" }),
      });
      const { swingId: id, uploadUrl } = await res.json() as { swingId: string; uploadUrl: string };
      setSwingId(id);

      // Upload video directly to R2
      await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": "video/webm" },
      });

      setVideoBlob(blob);
    } catch {
      setError("Upload failed — please try again.");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleProgress = useCallback((pct: number, label: string) => {
    setProgress(pct);
    setProgressLabel(label);
  }, []);

  const handleComplete = useCallback(() => {
    router.push(`/swings/${swingId}`);
  }, [router, swingId]);

  return (
    <main className="min-h-screen bg-green-950 text-white p-6">
      <div className="max-w-sm mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <a href="/" className="text-green-300 hover:text-white text-sm">← Back</a>
          <h1 className="text-xl font-bold">Record iron swing</h1>
        </div>

        <p className="text-green-300 text-sm">
          Stand so your full body is visible. Record your complete iron swing in one take.
        </p>

        {!videoBlob && !uploading && (
          <CameraRecorder onRecordingComplete={handleRecordingComplete} />
        )}

        {uploading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-green-300 text-sm">Uploading video…</p>
          </div>
        )}

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
              onProgress={handleProgress}
              onComplete={handleComplete}
              onError={setError}
            />
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm text-center bg-red-900/30 rounded-xl p-3">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
