"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { useLocale } from "@/context/LocaleContext";
import { getLocalizedProBio } from "@/lib/pro-traits";

interface Pro {
  id: string;
  name: string;
  slug: string;
}

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
        className="rounded-full object-cover shrink-0 ring-2 ring-green-700"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center font-bold text-white ring-2 ring-green-700 shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {proInitials(name)}
    </div>
  );
}

export default function ProsPage() {
  const { t, locale } = useLocale();
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
              const bio = getLocalizedProBio(pro.slug, locale);
              return (
                <li key={pro.id}>
                  <Link
                    href={`/pros/${pro.slug}`}
                    className="flex items-center gap-4 bg-green-900/60 hover:bg-green-800/70 rounded-2xl p-4 transition group"
                  >
                    <ProAvatar name={pro.name} slug={pro.slug} size={64} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base" style={{ fontFamily: "var(--font-playfair)" }}>
                        {pro.name}
                      </p>
                      {bio && (
                        <p className="text-green-400 text-sm mt-0.5 truncate">{bio.tagline}</p>
                      )}
                      {bio && (
                        <p className="text-green-600 text-xs mt-1">{bio.traits.length} {t.proTraitsCount}</p>
                      )}
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
