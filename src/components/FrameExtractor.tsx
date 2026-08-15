"use client";

import { useEffect, useRef } from "react";
import type { CheckpointResult } from "@/lib/poseDetection/types";
import { SWING_PHASES } from "@/lib/constants";
import type { SwingPhase } from "@/lib/constants";

interface Props {
  videoBlob: Blob;
  swingId: string;
  onProgress: (pct: number, label: string) => void;
  onComplete: () => void;
  onError: (msg: string) => void;
}

export default function FrameExtractor({
  videoBlob,
  swingId,
  onProgress,
  onComplete,
  onError,
}: Props) {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        onProgress(0, "Loading pose detector…");

        const { detectCheckpoints } = await import(
          "@/lib/poseDetection/checkpointDetector"
        );

        const checkpoints: CheckpointResult[] = await detectCheckpoints(
          videoBlob,
          (pct) => onProgress(pct * 0.8, "Detecting swing phases…")
        );

        onProgress(80, "Extracting frames…");

        // Get presigned upload URLs
        const urlRes = await fetch(`/api/swings/${swingId}/frames`);
        const { uploadUrls } = await urlRes.json() as { uploadUrls: Record<SwingPhase, string> };

        // For each checkpoint, seek video, capture frame, upload
        const videoUrl = URL.createObjectURL(videoBlob);
        const video = document.createElement("video");
        video.src = videoUrl;
        video.muted = true;
        await new Promise<void>((res) => { video.onloadedmetadata = () => res(); });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = 640;
        canvas.height = 360;

        for (let i = 0; i < checkpoints.length; i++) {
          const cp = checkpoints[i];
          video.currentTime = cp.timestampMs / 1000;
          await new Promise<void>((res) => {
            const handler = () => { video.removeEventListener("seeked", handler); res(); };
            video.addEventListener("seeked", handler);
          });

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const blob = await new Promise<Blob>((res) =>
            canvas.toBlob((b) => res(b!), "image/jpeg", 0.88)
          );

          await fetch(uploadUrls[cp.phase], {
            method: "PUT",
            body: blob,
            headers: { "Content-Type": "image/jpeg" },
          });

          onProgress(80 + ((i + 1) / checkpoints.length) * 15, `Uploaded ${cp.phase}`);
        }

        URL.revokeObjectURL(videoUrl);

        // Save metadata to DB
        onProgress(96, "Saving…");
        await fetch(`/api/swings/${swingId}/frames`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            checkpoints.map((c) => ({
              phase: c.phase,
              timestampMs: c.timestampMs,
              confidence: c.confidence,
            }))
          ),
        });

        onProgress(100, "Done");
        onComplete();
      } catch (err) {
        onError(err instanceof Error ? err.message : "Frame extraction failed");
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
