"use client";

import { SessionProvider } from "next-auth/react";
import { LocaleProvider } from "@/context/LocaleContext";
import BottomNav from "@/components/BottomNav";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LocaleProvider>
        {children}
        <BottomNav />
      </LocaleProvider>
    </SessionProvider>
  );
}
