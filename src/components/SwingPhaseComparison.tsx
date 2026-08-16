"use client";

import { SWING_PHASE_LABELS } from "@/lib/constants";
import type { SwingPhase } from "@/lib/constants";

interface FramePair {
  phase: SwingPhase;
  userImageUrl: string;
  proImageUrl: string;
  proName: string;
}

interface Props {
  pairs: FramePair[];
}

export default function SwingPhaseComparison({ pairs }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {pairs.map((pair) => (
        <div key={pair.phase} className="flex flex-col gap-2">
          <h3 className="text-green-200 font-semibold text-sm uppercase tracking-wide">
            {SWING_PHASE_LABELS[pair.phase]}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-green-400 text-center">You</span>
              <div className="bg-black rounded-lg overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pair.userImageUrl}
                  alt={`Your swing — ${pair.phase}`}
                  className="w-full h-auto max-h-64 object-contain"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-green-400 text-center">{pair.proName}</span>
              <div className="bg-black rounded-lg overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pair.proImageUrl}
                  alt={`${pair.proName} — ${pair.phase}`}
                  className="w-full h-auto max-h-64 object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
