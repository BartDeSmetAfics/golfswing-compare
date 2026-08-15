"use client";

import Image from "next/image";
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
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <Image
                  src={pair.userImageUrl}
                  alt={`Your swing — ${pair.phase}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-green-400 text-center">{pair.proName}</span>
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <Image
                  src={pair.proImageUrl}
                  alt={`${pair.proName} — ${pair.phase}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
