"use client";

import Link from "next/link";
import { type ReactNode } from "react";

interface AppHeaderProps {
  backHref?: string;
  backLabel?: string;
  title?: string;
  /** Optional element rendered on the right side of the header */
  rightAction?: ReactNode;
}

export default function AppHeader({ backHref, backLabel, title, rightAction }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3 min-w-0">
        {backHref ? (
          <>
            <Link href={backHref} className="text-green-300 hover:text-white text-sm shrink-0">
              ← {backLabel ?? "Back"}
            </Link>
            {title && (
              <h1 className="text-xl font-bold truncate" style={{ fontFamily: "var(--font-playfair)" }}>
                {title}
              </h1>
            )}
          </>
        ) : (
          <Link href="/" className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>
            SWINGIT
          </Link>
        )}
      </div>

      {rightAction && <div className="shrink-0">{rightAction}</div>}
    </header>
  );
}
