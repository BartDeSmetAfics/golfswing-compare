"use client";

import type { CheckpointResult, LandmarkSample } from "./types";
import type { SwingPhase } from "../constants";
import { SWING_PHASES } from "../constants";

// MediaPipe Pose landmark indices
const LEFT_WRIST = 15;
const RIGHT_WRIST = 16;
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
// DTL uses a lower threshold: one wrist is often behind the body
const MIN_VISIBILITY_FACE_ON = 0.5;
const MIN_VISIBILITY_DTL = 0.2;
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
  onProgress?: (pct: number) => void,
  cameraAngle: "FACE_ON" | "DOWN_THE_LINE" = "FACE_ON"
): Promise<CheckpointResult[]> {
  const MIN_VISIBILITY = cameraAngle === "DOWN_THE_LINE" ? MIN_VISIBILITY_DTL : MIN_VISIBILITY_FACE_ON;
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

      // DTL: max (either wrist visible is enough); FACE_ON: average
      const vis = cameraAngle === "DOWN_THE_LINE"
        ? Math.max(lw.visibility ?? 0, rw.visibility ?? 0)
        : ((lw.visibility ?? 0) + (rw.visibility ?? 0)) / 2;

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
  const handsXRaw = samples.map((s) => s.handsX);
  const handsYSmooth = movingAverage(handsYRaw, SMOOTH_WINDOW);
  const handsXSmooth = movingAverage(handsXRaw, SMOOTH_WINDOW);
  const dy = derivative(handsYSmooth);
  const dx = derivative(handsXSmooth);

  const results = cameraAngle === "DOWN_THE_LINE"
    ? findPhasesDownTheLine(samples, handsYSmooth, handsXSmooth, dy, dx)
    : findPhases(samples, handsYSmooth, dy);
  return results;
}

function findPhases(
  samples: LandmarkSample[],
  handsY: number[],
  dy: number[]
): CheckpointResult[] {
  const n = samples.length;
  const checkpoints: CheckpointResult[] = [];

  // Address: first window with low variance AND hands in lower half of frame (Y > 0.45).
  // The Y > 0.45 guard prevents follow-through positions (hands high = low Y) from being
  // mistakenly selected when the user starts recording mid-swing or after a previous swing.
  const STABLE_WINDOW = Math.max(5, Math.floor(n * 0.08));
  let addressIdx = 0;
  let minVar = Infinity;
  for (let i = 0; i < Math.floor(n * 0.5); i++) {
    const window = handsY.slice(i, i + STABLE_WINDOW);
    if (window.length < STABLE_WINDOW) break;
    const windowMeanY = window.reduce((a, b) => a + b, 0) / window.length;
    if (windowMeanY < 0.45) continue; // skip — hands too high (follow-through/backswing)
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

// DTL-specific phase detection using horizontal (X) hand motion as primary signal.
// From behind, hands sweep left→right during backswing and right→left through impact,
// making X-displacement far more reliable than Y for phase timing.
function findPhasesDownTheLine(
  samples: LandmarkSample[],
  handsY: number[],
  handsX: number[],
  dy: number[],
  dx: number[]
): CheckpointResult[] {
  const n = samples.length;
  const checkpoints: CheckpointResult[] = [];

  // Address: most stable X window in first 50%
  const STABLE_WINDOW = Math.max(5, Math.floor(n * 0.08));
  let addressIdx = 0;
  let minVar = Infinity;
  for (let i = 0; i < Math.floor(n * 0.5); i++) {
    const win = handsX.slice(i, i + STABLE_WINDOW);
    if (win.length < STABLE_WINDOW) break;
    const v = stdDev(win);
    if (v < minVar) { minVar = v; addressIdx = i + Math.floor(STABLE_WINDOW / 2); }
  }
  const addressX = handsX[addressIdx];

  checkpoints.push({
    phase: "ADDRESS",
    timestampMs: samples[addressIdx].timestampMs,
    confidence: Math.min(1, samples[addressIdx].visibility),
  });

  // Takeaway: first X movement > 3% of frame from address
  let takeawayIdx = addressIdx + 1;
  for (let i = addressIdx + 1; i < Math.floor(n * 0.7); i++) {
    if (Math.abs(handsX[i] - addressX) > 0.03) { takeawayIdx = i; break; }
  }
  checkpoints.push({
    phase: "TAKEAWAY",
    timestampMs: samples[takeawayIdx].timestampMs,
    confidence: Math.min(1, samples[takeawayIdx].visibility),
  });

  // Top of backswing: maximum X displacement from address (hands furthest from center)
  const backswingDir = handsX[Math.floor(n * 0.5)] > addressX ? 1 : -1;
  let topIdx = takeawayIdx + 1;
  let maxDisp = 0;
  for (let i = takeawayIdx + 1; i < Math.floor(n * 0.85); i++) {
    const disp = (handsX[i] - addressX) * backswingDir;
    if (disp > maxDisp) { maxDisp = disp; topIdx = i; }
  }
  checkpoints.push({
    phase: "TOP_OF_BACKSWING",
    timestampMs: samples[topIdx].timestampMs,
    confidence: Math.min(1, samples[topIdx].visibility),
  });

  // Downswing: after top, when X velocity back toward address exceeds 30% of peak
  const downVels = dx.slice(topIdx).map((v) => Math.abs(v));
  const peakDownVel = Math.max(...downVels, 0.001);
  let downswingIdx = topIdx + 1;
  for (let i = topIdx + 1; i < n; i++) {
    if (Math.abs(dx[i]) >= peakDownVel * 0.30) { downswingIdx = i; break; }
  }
  checkpoints.push({
    phase: "DOWNSWING_TRANSITION",
    timestampMs: samples[downswingIdx].timestampMs,
    confidence: Math.min(1, samples[downswingIdx].visibility),
  });

  // Impact: X closest to addressX after top (hands return to starting position)
  let impactIdx = downswingIdx + 1;
  let minDistToAddr = Infinity;
  for (let i = downswingIdx + 1; i < n; i++) {
    const dist = Math.abs(handsX[i] - addressX);
    if (dist < minDistToAddr) { minDistToAddr = dist; impactIdx = i; }
  }
  checkpoints.push({
    phase: "IMPACT",
    timestampMs: samples[impactIdx].timestampMs,
    confidence: Math.min(1, samples[impactIdx].visibility),
  });

  // Follow-through: furthest point past address X (opposite side from backswing)
  let followIdx = Math.min(impactIdx + 3, n - 1);
  let maxFollowDisp = 0;
  for (let i = impactIdx + 1; i < n; i++) {
    const disp = (handsX[i] - addressX) * -backswingDir;
    if (disp > maxFollowDisp) { maxFollowDisp = disp; followIdx = i; }
  }
  if (followIdx === Math.min(impactIdx + 3, n - 1)) {
    followIdx = Math.min(impactIdx + Math.floor((n - impactIdx) * 0.7), n - 1);
  }
  checkpoints.push({
    phase: "FOLLOW_THROUGH",
    timestampMs: samples[followIdx].timestampMs,
    confidence: Math.min(1, samples[followIdx].visibility),
  });

  const found = new Set(checkpoints.map((c) => c.phase));
  for (const p of [...SWING_PHASES]) {
    if (!found.has(p)) throw new Error(`Could not detect swing phase: ${p}`);
  }

  return checkpoints;
}
