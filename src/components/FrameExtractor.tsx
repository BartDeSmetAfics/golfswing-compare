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

        let checkpoints: CheckpointResult[];
        try {
          const { detectCheckpoints } = await import(
            "@/lib/poseDetection/checkpointDetector"
          );
          checkpoints = await Promise.race([
            detectCheckpoints(videoBlob, (pct) =>
              onProgress(pct * 0.8, "Detecting swing phases…")
            ),
            new Promise<never>((_, rej) =>
              setTimeout(() => rej(new Error("Pose detection timed out")), 60000)
            ),
          ]);
        } catch {
          // Fallback: evenly divide video into 6 phase timestamps
          onProgress(30, "Using even split (pose detection unavailable)…");
          const tmpUrl = URL.createObjectURL(videoBlob);
          const tmpVid = document.createElement("video");
          tmpVid.src = tmpUrl;
          tmpVid.playsInline = true;
          await new Promise<void>((res) => { tmpVid.onloadedmetadata = () => res(); setTimeout(res, 5000); });
          const dur = (tmpVid.duration || 5) * 1000;
          URL.revokeObjectURL(tmpUrl);
          checkpoints = SWING_PHASES.map((phase, i) => ({
            phase,
            timestampMs: Math.round(dur * (i + 0.5) / SWING_PHASES.length),
            confidence: 0.5,
          }));
        }

        onProgress(80, "Extracting frames…");

        // Get presigned upload URLs
        const urlRes = await fetch(`/api/swings/${swingId}/frames`);
        const { uploadUrls } = await urlRes.json() as { uploadUrls: Record<SwingPhase, string> };

        // For each checkpoint, seek video, capture frame, upload
        const videoUrl = URL.createObjectURL(videoBlob);
        const video = document.createElement("video");
        video.src = videoUrl;
        video.muted = true;
        video.playsInline = true;
        // iOS requires the element to be in the DOM for metadata + seeking to work
        video.style.position = "fixed";
        video.style.opacity = "0";
        video.style.pointerEvents = "none";
        document.body.appendChild(video);
        await new Promise<void>((res, rej) => {
          video.onloadedmetadata = () => res();
          setTimeout(() => rej(new Error("Video metadata timeout")), 15000);
        });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        // Preserve actual video aspect ratio — don't force 16:9
        const MAX_DIM = 1280;
        const vw = video.videoWidth || 640;
        const vh = video.videoHeight || 360;
        const scale = Math.min(MAX_DIM / vw, MAX_DIM / vh, 1);
        canvas.width = Math.round(vw * scale);
        canvas.height = Math.round(vh * scale);

        for (let i = 0; i < checkpoints.length; i++) {
          const cp = checkpoints[i];
          video.currentTime = cp.timestampMs / 1000;
          await new Promise<void>((res) => {
            const handler = () => { video.removeEventListener("seeked", handler); res(); };
            video.addEventListener("seeked", handler);
            // Fallback if seeked never fires (iOS quirk)
            setTimeout(res, 2000);
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

        document.body.removeChild(video);
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
