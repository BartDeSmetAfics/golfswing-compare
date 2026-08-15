import type { SwingPhase } from "../constants";

export interface CheckpointResult {
  phase: SwingPhase;
  timestampMs: number;
  confidence: number;
}

export interface LandmarkSample {
  timestampMs: number;
  handsY: number;
  handsX: number;
  shouldersY: number;
  visibility: number;
}
