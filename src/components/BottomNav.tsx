"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale } from "@/context/LocaleContext";

const AUTH_PATHS = ["/login", "/register"];

function SwingsIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function ExercisesIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ProsIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { t } = useLocale();

  // Don't render on auth pages or while session is loading
  if (AUTH_PATHS.includes(pathname) || status === "loading" || !session) {
    return null;
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const tabs = [
    { href: "/", label: t.navSwings, Icon: SwingsIcon },
    { href: "/exercises", label: t.navExercises, Icon: ExercisesIcon },
    { href: "/pros", label: t.navPros, Icon: ProsIcon },
    { href: "/profile", label: t.navProfile, Icon: ProfileIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-green-950/95 backdrop-blur-sm border-t border-green-800 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center max-w-lg mx-auto h-16">
        {/* Left two tabs */}
        {tabs.slice(0, 2).map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors"
            >
              <Icon className={`w-5 h-5 ${active ? "text-green-400" : "text-green-600"}`} />
              <span className={`text-[10px] font-medium ${active ? "text-green-400" : "text-green-600"}`}>
                {label}
              </span>
            </Link>
          );
        })}

        {/* Centre record button */}
        <div className="flex-1 flex items-center justify-center">
          <Link
            href="/record"
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all ${
              isActive("/record")
                ? "bg-green-400 text-green-950 shadow-lg shadow-green-400/30"
                : "bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-900"
            }`}
          >
            <CameraIcon className="w-6 h-6" />
            <span className="text-[9px] font-semibold mt-0.5">{t.navRecord}</span>
          </Link>
        </div>

        {/* Right two tabs */}
        {tabs.slice(2).map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors"
            >
              <Icon className={`w-5 h-5 ${active ? "text-green-400" : "text-green-600"}`} />
              <span className={`text-[10px] font-medium ${active ? "text-green-400" : "text-green-600"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
