"use client";

import { useState } from "react";
import { SWING_PHASE_LABELS } from "@/lib/constants";
import type { SwingPhase, CameraAngle } from "@/lib/constants";
import type { AnalysisResult, CheckpointFeedback } from "@/lib/claude";

interface Props {
  swingId: string;
  proId: string;
  cameraAngle?: CameraAngle;
  existingAnalysis?: AnalysisResult | null;
}

export default function CoachingFeedback({ swingId, proId, cameraAngle = "FACE_ON", existingAnalysis }: Props) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(
    existingAnalysis ?? null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runAnalysis() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/swings/${swingId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proId, cameraAngle }),
      });
      const text = await res.text();
      if (!res.ok) {
        let msg = "Analysis failed";
        try { msg = (JSON.parse(text) as { error?: string }).error ?? msg; } catch (_) {}
        throw new Error(msg);
      }
      const data = JSON.parse(text) as { result: AnalysisResult };
      setAnalysis(data.result as AnalysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  if (!analysis) {
    return (
      <div className="flex flex-col gap-3">
        {error && (
          <p className="text-red-400 text-sm bg-red-900/30 rounded-xl p-3">{error}</p>
        )}
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl py-3 font-semibold transition"
        >
          {loading ? "Analysing with Claude…" : "Get AI coaching feedback"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-green-900 rounded-xl p-4">
        <p className="text-green-100 text-sm leading-relaxed">{analysis.overall_summary}</p>
      </div>

      {analysis.top_priorities.length > 0 && (
        <div>
          <h3 className="text-green-200 font-semibold text-sm uppercase tracking-wide mb-2">
            Top priorities
          </h3>
          <ul className="flex flex-col gap-2">
            {analysis.top_priorities.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm text-green-100">
                <span className="text-green-400 font-bold">{i + 1}.</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <h3 className="text-green-200 font-semibold text-sm uppercase tracking-wide">
          Phase by phase
        </h3>
        {analysis.checkpoints.map((cp: CheckpointFeedback) => (
          <div key={cp.phase} className="bg-green-900/50 rounded-xl p-4 flex flex-col gap-2">
            <h4 className="text-green-300 font-semibold text-xs uppercase tracking-wide">
              {SWING_PHASE_LABELS[cp.phase as SwingPhase] ?? cp.phase}
            </h4>
            <p className="text-white text-sm">{cp.observation}</p>
            <p className="text-green-300 text-sm italic">{cp.comparison_to_pro}</p>
            <p className="text-yellow-300 text-sm">
              <span className="font-semibold">Tip:</span> {cp.coaching_tip}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={runAnalysis}
        disabled={loading}
        className="text-green-400 text-sm hover:text-green-200 disabled:opacity-50 underline"
      >
        {loading ? "Analysing…" : "Re-analyse"}
      </button>
    </div>
  );
}
