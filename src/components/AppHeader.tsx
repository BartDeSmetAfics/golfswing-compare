"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email ? email[0].toUpperCase() : "?";
}

interface AppHeaderProps {
  backHref?: string;
  backLabel?: string;
  title?: string;
}

export default function AppHeader({ backHref, backLabel, title }: AppHeaderProps) {
  const { data: session } = useSession();
  const initials = getInitials(session?.user?.name, session?.user?.email);

  return (
    <header className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        {backHref ? (
          <>
            <Link href={backHref} className="text-green-300 hover:text-white text-sm">
              ← {backLabel ?? "Back"}
            </Link>
            {title && (
              <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>
                {title}
              </h1>
            )}
          </>
        ) : (
          <Link href="/" className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>
            GolfSwing Compare
          </Link>
        )}
      </div>

      <Link
        href="/profile"
        className="w-9 h-9 rounded-full bg-green-600 hover:bg-green-500 flex items-center justify-center text-sm font-semibold text-white transition-colors ring-2 ring-green-800 hover:ring-green-500"
        title="Your profile"
      >
        {initials}
      </Link>
    </header>
  );
}
