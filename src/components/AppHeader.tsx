"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

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
  /** Replaces the default profile avatar circle on the right */
  rightAction?: ReactNode;
}

export default function AppHeader({ backHref, backLabel, title, rightAction }: AppHeaderProps) {
  const { data: session } = useSession();
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const initials = getInitials(session?.user?.name, session?.user?.email);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: { avatarBase64?: string | null }) => {
        if (data.avatarBase64) setAvatarSrc(data.avatarBase64);
      })
      .catch(() => {});
  }, [session?.user]);

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

      {rightAction ?? (
        <Link
          href="/profile"
          className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-green-800 hover:ring-green-500 transition-all"
          title="Your profile"
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-green-600 hover:bg-green-500 flex items-center justify-center text-sm font-semibold text-white transition-colors">
              {initials}
            </div>
          )}
        </Link>
      )}
    </header>
  );
}
