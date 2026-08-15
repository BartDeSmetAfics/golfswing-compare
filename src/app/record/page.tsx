"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import CameraRecorder from "@/components/CameraRecorder";
import FrameExtractor from "@/components/FrameExtractor";
import AppHeader from "@/components/AppHeader";

type Mode = "record" | "upload";

export default function RecordPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("record");
  const [swingId, setSwingId] = useState<string | null>(null);
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
      const res = await fetch("/api/swings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubType: "IRON", videoMimeType: mimeType }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(`Server error ${res.status}: ${body.error ?? "unknown"}`);
      }
      const { swingId: id, uploadUrl } = await res.json() as { swingId: string; uploadUrl: string };
      setSwingId(id);

      const r2Res = await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": mimeType },
      });
      if (!r2Res.ok) {
        throw new Error(`R2 upload failed ${r2Res.status}: ${await r2Res.text()}`);
      }

      setVideoBlob(blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed — please try again.");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleRecordingComplete = useCallback((blob: Blob) => {
    uploadVideo(blob, "video/webm");
  }, [uploadVideo]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mimeType = file.type || "video/mp4";
    uploadVideo(file, mimeType);
  }, [uploadVideo]);

  const handleProgress = useCallback((pct: number, label: string) => {
    setProgress(pct);
    setProgressLabel(label);
  }, []);

  const handleComplete = useCallback(() => {
    router.push(`/swings/${swingId}`);
  }, [router, swingId]);

  const reset = () => {
    setSwingId(null);
    setVideoBlob(null);
    setProgress(0);
    setProgressLabel("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <main className="min-h-screen bg-green-950 text-white p-6">
      <div className="max-w-sm mx-auto flex flex-col gap-6">
        <AppHeader backHref="/" backLabel="Dashboard" title="New iron swing" />

        {/* Mode tabs — only show before upload starts */}
        {!videoBlob && !uploading && (
          <div className="flex rounded-xl overflow-hidden border border-green-800">
            <button
              onClick={() => { setMode("record"); reset(); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === "record"
                  ? "bg-green-600 text-white"
                  : "bg-green-900/40 text-green-300 hover:bg-green-900"
              }`}
            >
              🎥 Record now
            </button>
            <button
              onClick={() => { setMode("upload"); reset(); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === "upload"
                  ? "bg-green-600 text-white"
                  : "bg-green-900/40 text-green-300 hover:bg-green-900"
              }`}
            >
              📁 Upload video
            </button>
          </div>
        )}

        {/* Record mode */}
        {mode === "record" && !videoBlob && !uploading && (
          <>
            <p className="text-green-300 text-sm">
              Stand so your full body is visible. Record your complete iron swing in one take.
            </p>
            <CameraRecorder onRecordingComplete={handleRecordingComplete} />
          </>
        )}

        {/* Upload mode */}
        {mode === "upload" && !videoBlob && !uploading && (
          <>
            <p className="text-green-300 text-sm">
              Choose a video of your iron swing from your photo library.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-green-600 rounded-2xl p-10 text-green-300 hover:border-green-400 hover:text-white transition-colors"
            >
              <span className="text-4xl">📹</span>
              <span className="text-sm font-medium">Tap to choose video</span>
              <span className="text-xs text-green-500">MP4, MOV, WebM supported</span>
            </button>
          </>
        )}

        {/* Uploading spinner */}
        {uploading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-green-300 text-sm">Uploading video…</p>
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
