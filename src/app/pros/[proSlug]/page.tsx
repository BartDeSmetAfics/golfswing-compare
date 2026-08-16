"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { useLocale } from "@/context/LocaleContext";
import { getLocalizedProBio } from "@/lib/pro-traits";
import { SWING_PHASE_LABELS } from "@/lib/constants";
import type { SwingPhase } from "@/lib/constants";

function proInitials(name: string) {
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

function ProAvatar({ name, slug, size = 64 }: { name: string; slug: string; size?: number }) {
  const { locale } = useLocale();
  const bio = getLocalizedProBio(slug, locale);
  const [imgError, setImgError] = useState(false);

  if (bio?.avatarPath && !imgError) {
    return (
      <img
        src={bio.avatarPath}
        alt={name}
        width={size}
        height={size}
        onError={() => setImgError(true)}
        className="rounded-full object-cover shrink-0 ring-4 ring-green-700"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center font-bold text-white ring-4 ring-green-700 shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {proInitials(name)}
    </div>
  );
}

interface Pro {
  id: string;
  name: string;
  slug: string;
}

interface ReferenceFrame {
  id: string;
  phase: SwingPhase;
  cameraAngle: string;
  imageUrl: string;
}

type AngleTab = "FACE_ON" | "DOWN_THE_LINE";

export default function ProDetailPage() {
  const { proSlug } = useParams<{ proSlug: string }>();
  const { t, locale } = useLocale();
  const bio = getLocalizedProBio(proSlug, locale);

  const [pro, setPro] = useState<Pro | null>(null);
  const [frames, setFrames] = useState<ReferenceFrame[]>([]);
  const [angle, setAngle] = useState<AngleTab>("FACE_ON");
  const [loadingPro, setLoadingPro] = useState(true);
  const [loadingFrames, setLoadingFrames] = useState(false);
  const [expandedTrait, setExpandedTrait] = useState<number | null>(null);

  // Load pro ID from slug
  useEffect(() => {
    fetch("/api/pros")
      .then((r) => r.json())
      .then((pros: Pro[]) => {
        const found = pros.find((p) => p.slug === proSlug);
        setPro(found ?? null);
        setLoadingPro(false);
      });
  }, [proSlug]);

  // Load reference frames when pro or angle changes
  useEffect(() => {
    if (!pro) return;
    setLoadingFrames(true);
    fetch(`/api/pros/${pro.id}?clubType=IRON&cameraAngle=${angle}`)
      .then((r) => r.json())
      .then((data: ReferenceFrame[]) => { setFrames(data); setLoadingFrames(false); });
  }, [pro, angle]);

  if (loadingPro) {
    return (
      <main className="min-h-screen bg-green-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!pro) {
    return (
      <main className="min-h-screen bg-green-950 text-white p-6 flex items-center justify-center">
        <p className="text-green-400">{t.proNotFound}</p>
      </main>
    );
  }

  const parts = pro.name.trim().split(" ");
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();

  return (
    <main className="min-h-screen bg-green-950 text-white p-6 pb-24">
      <div className="max-w-lg mx-auto flex flex-col gap-6">
        <AppHeader backHref="/pros" backLabel={t.navPros} />

        {/* Hero */}
        <div className="flex items-center gap-4 bg-green-900/60 rounded-2xl p-5">
          <ProAvatar name={pro.name} slug={pro.slug} size={80} />
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>
              {pro.name}
            </h1>
            {bio && <p className="text-green-400 text-sm mt-1">{bio.tagline}</p>}
          </div>
        </div>

        {/* Signature traits */}
        {bio && (
          <section>
            <h2 className="text-sm font-semibold text-green-300 uppercase tracking-wide mb-3">
              {t.proSignatureTraits}
            </h2>
            <ul className="flex flex-col gap-2">
              {bio.traits.map((trait, i) => (
                <li key={i}>
                  <button
                    onClick={() => setExpandedTrait(expandedTrait === i ? null : i)}
                    className="w-full flex items-center gap-3 bg-green-900/50 hover:bg-green-800/60 rounded-xl px-4 py-3 transition text-left"
                  >
                    <span className="text-xl shrink-0">{trait.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-white">{trait.title}</p>
                      {expandedTrait === i && (
                        <p className="text-green-300 text-sm mt-2 leading-relaxed">{trait.description}</p>
                      )}
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-4 h-4 text-green-600 shrink-0 transition-transform ${expandedTrait === i ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Reference frames */}
        <section>
          <h2 className="text-sm font-semibold text-green-300 uppercase tracking-wide mb-3">
            {t.proReferenceFrames}
          </h2>

          {/* Angle toggle */}
          <div className="flex rounded-xl overflow-hidden border border-green-800 mb-4">
            {(["FACE_ON", "DOWN_THE_LINE"] as AngleTab[]).map((a) => (
              <button
                key={a}
                onClick={() => setAngle(a)}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${
                  angle === a
                    ? "bg-green-600 text-white"
                    : "bg-green-900/40 text-green-300 hover:bg-green-900"
                }`}
              >
                {a === "FACE_ON" ? t.faceOnFrames : t.dtlFrames}
              </button>
            ))}
          </div>

          {loadingFrames ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : frames.length === 0 ? (
            <p className="text-green-500 text-sm">{t.noFrames}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {frames.map((frame) => (
                <div key={frame.id} className="relative rounded-xl overflow-hidden bg-green-900/40 aspect-[3/4]">
                  <img
                    src={frame.imageUrl}
                    alt={`${pro.name} — ${SWING_PHASE_LABELS[frame.phase] ?? frame.phase}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2">
                    <p className="text-white text-xs font-medium">
                      {SWING_PHASE_LABELS[frame.phase] ?? frame.phase}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
