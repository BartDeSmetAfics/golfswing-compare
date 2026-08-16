"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { useLocale } from "@/context/LocaleContext";
import { getProBio } from "@/lib/pro-traits";

interface Pro {
  id: string;
  name: string;
  slug: string;
}

function ProInitials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  return (
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-xl font-bold text-white ring-2 ring-green-700 shrink-0">
      {initials}
    </div>
  );
}

export default function ProsPage() {
  const { t } = useLocale();
  const [pros, setPros] = useState<Pro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pros")
      .then((r) => r.json())
      .then((data: Pro[]) => { setPros(data); setLoading(false); });
  }, []);

  return (
    <main className="min-h-screen bg-green-950 text-white p-6 pb-24">
      <div className="max-w-lg mx-auto flex flex-col gap-6">
        <AppHeader title={t.prosTitle} />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pros.length === 0 ? (
          <p className="text-green-400 text-sm">{t.prosEmpty}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {pros.map((pro) => {
              const bio = getProBio(pro.slug);
              return (
                <li key={pro.id}>
                  <Link
                    href={`/pros/${pro.slug}`}
                    className="flex items-center gap-4 bg-green-900/60 hover:bg-green-800/70 rounded-2xl p-4 transition group"
                  >
                    <ProInitials name={pro.name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base" style={{ fontFamily: "var(--font-playfair)" }}>
                        {pro.name}
                      </p>
                      {bio && (
                        <p className="text-green-400 text-sm mt-0.5 truncate">{bio.tagline}</p>
                      )}
                      <p className="text-green-500 text-xs mt-1">
                        {bio ? `${bio.traits.length} kenmerken` : "Referentieframes beschikbaar"}
                      </p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-600 group-hover:text-green-400 transition shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
