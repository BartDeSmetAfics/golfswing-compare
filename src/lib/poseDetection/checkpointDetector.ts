"use client";

import type { CheckpointResult, LandmarkSample } from "./types";
import type { SwingPhase } from "../constants";
import { SWING_PHASES } from "../constants";

// MediaPipe Pose landmark indices
const LEFT_WRIST = 15;
const RIGHT_WRIST = 16;
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const MIN_VISIBILITY = 0.5;
const SAMPLE_INTERVAL_MS = 40;
const SMOOTH_WINDOW = 5;

function movingAverage(arr: number[], window: number): number[] {
  return arr.map((_, i) => {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end = Math.min(arr.length, start + window);
    const slice = arr.slice(start, end);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

function derivative(arr: number[]): number[] {
  return arr.map((v, i) => (i === 0 ? 0 : v - arr[i - 1]));
}

function stdDev(arr: number[]): number {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length);
}

export async function detectCheckpoints(
  videoBlob: Blob,
  onProgress?: (pct: number) => void
): Promise<CheckpointResult[]> {
  const { PoseLandmarker, FilesetResolver } =
    await import("@mediapipe/tasks-vision");

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
  );

  const landmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numPoses: 1,
  });

  const videoUrl = URL.createObjectURL(videoBlob);
  const video = document.createElement("video");
  video.src = videoUrl;
  video.muted = true;

  await new Promise<void>((res) => {
    video.onloadedmetadata = () => res();
  });

  const duration = video.duration * 1000;
  const timestamps: number[] = [];
  for (let t = 0; t < duration; t += SAMPLE_INTERVAL_MS) {
    timestamps.push(t);
  }

  const samples: LandmarkSample[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    const t = timestamps[i];
    video.currentTime = t / 1000;
    await new Promise<void>((res) => {
      const handler = () => { video.removeEventListener("seeked", handler); res(); };
      video.addEventListener("seeked", handler);
    });

    const result = landmarker.detectForVideo(video, t);
    if (result.landmarks && result.landmarks[0]) {
      const lm = result.landmarks[0];
      const lw = lm[LEFT_WRIST];
      const rw = lm[RIGHT_WRIST];
      const ls = lm[LEFT_SHOULDER];
      const rs = lm[RIGHT_SHOULDER];

      const vis = Math.min(
        lw.visibility ?? 0,
        rw.visibility ?? 0
      );

      if (vis >= MIN_VISIBILITY) {
        samples.push({
          timestampMs: t,
          handsY: (lw.y + rw.y) / 2,
          handsX: (lw.x + rw.x) / 2,
          shouldersY: ((ls?.y ?? 0) + (rs?.y ?? 0)) / 2,
          visibility: vis,
        });
      }
    }

    onProgress?.((i / timestamps.length) * 100);
  }

  URL.revokeObjectURL(videoUrl);
  landmarker.close();

  if (samples.length < 10) {
    throw new Error("Too few pose detections — ensure your full body is visible and lighting is adequate.");
  }

  const handsYRaw = samples.map((s) => s.handsY);
  const handsYSmooth = movingAverage(handsYRaw, SMOOTH_WINDOW);
  const dy = derivative(handsYSmooth);

  const results = findPhases(samples, handsYSmooth, dy);
  return results;
}

function findPhases(
  samples: LandmarkSample[],
  handsY: number[],
  dy: number[]
): CheckpointResult[] {
  const n = samples.length;
  const checkpoints: CheckpointResult[] = [];

  // Address: first window with low variance (golfer is set up, not moving yet)
  const STABLE_WINDOW = Math.max(5, Math.floor(n * 0.08));
  let addressIdx = 0;
  let minVar = Infinity;
  for (let i = 0; i < Math.floor(n * 0.4); i++) {
    const window = handsY.slice(i, i + STABLE_WINDOW);
    if (window.length < STABLE_WINDOW) break;
    const v = stdDev(window);
    if (v < minVar) { minVar = v; addressIdx = i + Math.floor(STABLE_WINDOW / 2); }
  }
  const addressY = handsY[addressIdx];

  checkpoints.push({
    phase: "ADDRESS",
    timestampMs: samples[addressIdx].timestampMs,
    confidence: Math.min(1, samples[addressIdx].visibility),
  });

  // Takeaway: first significant movement above address position (hands rising)
  const TAKEAWAY_THRESHOLD = 0.03;
  let takeawayIdx = addressIdx + 1;
  for (let i = addressIdx + 1; i < Math.floor(n * 0.6); i++) {
    if (Math.abs(handsY[i] - addressY) > TAKEAWAY_THRESHOLD) {
      takeawayIdx = i;
      break;
    }
  }

  checkpoints.push({
    phase: "TAKEAWAY",
    timestampMs: samples[takeawayIdx].timestampMs,
    confidence: Math.min(1, samples[takeawayIdx].visibility),
  });

  // Top of backswing: local minimum of handsY (hands highest = lowest Y value)
  // Search from takeaway to 80% of the swing
  let topIdx = takeawayIdx + 1;
  let minY = Infinity;
  for (let i = takeawayIdx + 1; i < Math.floor(n * 0.8); i++) {
    if (handsY[i] < minY && dy[i] >= 0 && i > 0 && dy[i - 1] < 0) {
      minY = handsY[i];
      topIdx = i;
    }
  }
  // Fallback: just the minimum in range
  if (topIdx === takeawayIdx + 1) {
    for (let i = takeawayIdx + 1; i < Math.floor(n * 0.7); i++) {
      if (handsY[i] < minY) { minY = handsY[i]; topIdx = i; }
    }
  }

  checkpoints.push({
    phase: "TOP_OF_BACKSWING",
    timestampMs: samples[topIdx].timestampMs,
    confidence: Math.min(1, samples[topIdx].visibility),
  });

  // Downswing/transition: after top, when downward velocity reaches 30% of peak
  const downVelocities = dy.slice(topIdx).map(Math.abs);
  const peakDownVel = Math.max(...downVelocities);
  const DOWNSWING_THRESHOLD = peakDownVel * 0.30;
  let downswingIdx = topIdx + 1;
  for (let i = topIdx + 1; i < n; i++) {
    if (Math.abs(dy[i]) >= DOWNSWING_THRESHOLD) {
      downswingIdx = i;
      break;
    }
  }

  checkpoints.push({
    phase: "DOWNSWING_TRANSITION",
    timestampMs: samples[downswingIdx].timestampMs,
    confidence: Math.min(1, samples[downswingIdx].visibility),
  });

  // Impact: peak downward velocity, with hands near address height
  let impactIdx = downswingIdx + 1;
  let maxVel = 0;
  for (let i = downswingIdx + 1; i < n; i++) {
    const vel = Math.abs(dy[i]);
    if (vel > maxVel) {
      maxVel = vel;
      impactIdx = i;
    }
  }

  checkpoints.push({
    phase: "IMPACT",
    timestampMs: samples[impactIdx].timestampMs,
    confidence: Math.min(1, samples[impactIdx].visibility),
  });

  // Follow-through: local minimum of handsY after impact (hands at highest = smallest Y value)
  let followIdx = Math.min(impactIdx + 3, n - 1);
  let minYAfterImpact = Infinity;
  for (let i = impactIdx + 1; i < n; i++) {
    if (handsY[i] < minYAfterImpact && dy[i] >= 0 && i > 0 && dy[i - 1] < 0) {
      minYAfterImpact = handsY[i];
      followIdx = i;
    }
  }
  // Fallback: 70% between impact and end
  if (followIdx === Math.min(impactIdx + 3, n - 1)) {
    followIdx = Math.min(impactIdx + Math.floor((n - impactIdx) * 0.7), n - 1);
  }

  checkpoints.push({
    phase: "FOLLOW_THROUGH",
    timestampMs: samples[followIdx].timestampMs,
    confidence: Math.min(1, samples[followIdx].visibility),
  });

  // Verify all 6 phases are present (should always be the case, but guard)
  const found = new Set(checkpoints.map((c) => c.phase));
  const allPhases: SwingPhase[] = [...SWING_PHASES];
  for (const p of allPhases) {
    if (!found.has(p)) {
      throw new Error(`Could not detect swing phase: ${p}`);
    }
  }

  return checkpoints;
}
