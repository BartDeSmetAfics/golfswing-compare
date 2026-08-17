"use client";

import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { useLocale } from "@/context/LocaleContext";
import type { Exercise } from "@/types/exercises";

interface ExercisesResponse {
  exercises: Exercise[];
  noAnalyses?: boolean;
}

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const { t } = useLocale();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-green-900/60 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-green-800/40 transition"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-base">{exercise.title}</p>
            <span className="text-xs bg-green-800 text-green-300 px-2 py-0.5 rounded-full shrink-0">
              {exercise.focusArea}
            </span>
          </div>
          <p className="text-green-400 text-sm mt-0.5 line-clamp-1">{exercise.description}</p>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-4 h-4 text-green-600 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 flex flex-col gap-4 border-t border-green-800/60 pt-4">
          <p className="text-green-200 text-sm leading-relaxed">{exercise.description}</p>

          {exercise.steps.length > 0 && (
            <div>
              <ol className="flex flex-col gap-2">
                {exercise.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-green-100">
                    <span className="w-5 h-5 rounded-full bg-green-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex-1 bg-green-950/60 rounded-xl px-3 py-2">
              <p className="text-green-500 text-xs mb-0.5">{t.exerciseReps}</p>
              <p className="text-green-200 text-sm font-medium">{exercise.reps}</p>
            </div>
          </div>

          <div className="bg-yellow-900/30 border border-yellow-800/40 rounded-xl px-3 py-2">
            <p className="text-yellow-400 text-xs font-semibold mb-0.5">{t.exerciseWhy}</p>
            <p className="text-yellow-200 text-sm leading-relaxed">{exercise.why}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExercisesPage() {
  const { t } = useLocale();
  const [data, setData] = useState<ExercisesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/exercises")
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json() as Promise<ExercisesResponse>;
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError(t.exercisesError); setLoading(false); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="min-h-screen bg-green-950/75 text-white p-6 pb-24">
      <div className="max-w-lg mx-auto flex flex-col gap-6">
        <AppHeader title={t.exercisesTitle} />

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-green-400 text-sm">{t.exercisesLoading}</p>
          </div>
        ) : error ? (
          <p className="text-red-400 text-sm bg-red-900/30 rounded-xl p-4">{error}</p>
        ) : data?.noAnalyses || !data?.exercises.length ? (
          <div className="bg-green-900/40 rounded-2xl p-6 text-center flex flex-col gap-3">
            <div className="text-4xl">⚡</div>
            <p className="text-green-300 text-sm leading-relaxed">{t.exercisesEmpty}</p>
          </div>
        ) : (
          <>
            <p className="text-green-400 text-sm">{t.exercisesIntro}</p>
            <div className="flex flex-col gap-3">
              {data.exercises.map((ex, i) => (
                <ExerciseCard key={i} exercise={ex} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
