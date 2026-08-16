"use client";

import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import { useLocale } from "@/context/LocaleContext";
import { LOCALES, type Locale } from "@/lib/i18n";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-green-900/60 rounded-2xl p-5 flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-green-300 uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  );
}

function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-green-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-green-950 border border-green-700 rounded-lg px-3 py-2 text-sm text-white placeholder-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  );
}

export default function SettingsPage() {
  const { t, locale, setLocale } = useLocale();

  // Email section
  const [newEmail, setNewEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  // Password section
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  async function saveEmail() {
    setEmailMsg(null);
    setEmailLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "email", newEmail }),
      });
      if (res.ok) {
        setEmailMsg({ ok: true, text: t.saved });
        setNewEmail("");
      } else {
        const data = await res.json() as { error: string };
        const key = data.error as keyof typeof t;
        setEmailMsg({ ok: false, text: (t[key] as string) ?? data.error });
      }
    } finally {
      setEmailLoading(false);
    }
  }

  async function savePassword() {
    setPwMsg(null);
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: t.passwordMismatch });
      return;
    }
    if (newPw.length < 8) {
      setPwMsg({ ok: false, text: t.passwordTooShort });
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "password", currentPassword: currentPw, newPassword: newPw }),
      });
      if (res.ok) {
        setPwMsg({ ok: true, text: t.saved });
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
      } else {
        const data = await res.json() as { error: string };
        const key = data.error as keyof typeof t;
        setPwMsg({ ok: false, text: (t[key] as string) ?? data.error });
      }
    } finally {
      setPwLoading(false);
    }
  }

  const LOCALE_LABELS: Record<Locale, string> = {
    nl: t.langNl,
    en: t.langEn,
    fr: t.langFr,
  };

  return (
    <main className="min-h-screen bg-green-950 text-white p-6 pb-16">
      <div className="max-w-lg mx-auto flex flex-col gap-6">
        <AppHeader backHref="/profile" backLabel={t.yourProfile} title={t.settings} />

        {/* Language */}
        <Section title={t.language}>
          <div className="flex gap-2">
            {LOCALES.map((loc) => (
              <button
                key={loc}
                onClick={() => setLocale(loc)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  locale === loc
                    ? "bg-green-600 text-white"
                    : "bg-green-900/60 text-green-300 hover:bg-green-800 border border-green-700"
                }`}
              >
                {LOCALE_LABELS[loc]}
              </button>
            ))}
          </div>
        </Section>

        {/* Email */}
        <Section title={t.changeEmail}>
          <InputField
            label={t.newEmail}
            type="email"
            value={newEmail}
            onChange={setNewEmail}
            placeholder="name@example.com"
          />
          {emailMsg && (
            <p className={`text-sm ${emailMsg.ok ? "text-green-400" : "text-red-400"}`}>
              {emailMsg.text}
            </p>
          )}
          <button
            onClick={saveEmail}
            disabled={emailLoading || !newEmail}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition"
          >
            {emailLoading ? t.saving : t.saveEmail}
          </button>
        </Section>

        {/* Password */}
        <Section title={t.changePassword}>
          <InputField
            label={t.currentPassword}
            type="password"
            value={currentPw}
            onChange={setCurrentPw}
          />
          <InputField
            label={t.newPassword}
            type="password"
            value={newPw}
            onChange={setNewPw}
          />
          <InputField
            label={t.confirmPassword}
            type="password"
            value={confirmPw}
            onChange={setConfirmPw}
          />
          {pwMsg && (
            <p className={`text-sm ${pwMsg.ok ? "text-green-400" : "text-red-400"}`}>
              {pwMsg.text}
            </p>
          )}
          <button
            onClick={savePassword}
            disabled={pwLoading || !currentPw || !newPw || !confirmPw}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition"
          >
            {pwLoading ? t.saving : t.savePassword}
          </button>
        </Section>
      </div>
    </main>
  );
}
