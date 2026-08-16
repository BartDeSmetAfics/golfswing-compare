"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Swing {
  id: string;
  clubType: string;
  status: string;
  createdAt: string;
}

export default function SwingList({ initialSwings }: { initialSwings: Swing[] }) {
  const router = useRouter();
  const [swings, setSwings] = useState<Swing[]>(initialSwings);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/swings/${id}`, { method: "DELETE" });
      setSwings((prev) => prev.filter((s) => s.id !== id));
      router.refresh();
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  if (swings.length === 0) {
    return (
      <p className="text-green-400 text-sm">
        Nog geen slagen — neem je eerste hierboven op.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {swings.map((swing) => (
        <li key={swing.id} className="relative">
          {confirmId === swing.id ? (
            <div className="flex items-center justify-between bg-red-900/60 border border-red-700 rounded-xl px-5 py-4 gap-3">
              <span className="text-sm text-red-200">Slag verwijderen?</span>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setConfirmId(null)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-green-900 text-green-300 hover:bg-green-800 transition"
                >
                  Annuleer
                </button>
                <button
                  onClick={() => handleDelete(swing.id)}
                  disabled={deletingId === swing.id}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 transition"
                >
                  {deletingId === swing.id ? "Verwijderen…" : "Verwijder"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href={`/swings/${swing.id}`}
                className="flex-1 flex items-center justify-between bg-green-900 hover:bg-green-800 rounded-xl px-5 py-4 transition"
              >
                <span className="font-medium capitalize">
                  {swing.clubType.toLowerCase()} swing
                </span>
                <span className="flex items-center gap-3 text-sm text-green-300">
                  <span
                    className={
                      swing.status === "PROCESSED"
                        ? "text-green-400"
                        : swing.status === "FAILED"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }
                  >
                    {swing.status === "PROCESSED"
                      ? "klaar"
                      : swing.status === "FAILED"
                      ? "mislukt"
                      : "verwerken…"}
                  </span>
                  <span>
                    {new Date(swing.createdAt).toLocaleDateString("nl-BE", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </span>
              </Link>
              <button
                onClick={() => setConfirmId(swing.id)}
                className="p-3 rounded-xl text-green-600 hover:text-red-400 hover:bg-green-900 transition"
                aria-label="Verwijder slag"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
