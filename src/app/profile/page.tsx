"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import AvatarCropper from "@/components/AvatarCropper";
import { useLocale } from "@/context/LocaleContext";
import { localeToDateLocale } from "@/lib/i18n";

interface Swing {
  id: string;
  clubType: string;
  status: string;
  createdAt: string;
}

interface Profile {
  id: string;
  name: string | null;
  email: string;
  handicap: number | null;
  avatarBase64: string | null;
  createdAt: string;
  swings: Swing[];
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email ? email[0].toUpperCase() : "?";
}

function GearIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default function ProfilePage() {
  const { t, locale } = useLocale();
  const dateLocale = localeToDateLocale(locale);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [handicap, setHandicap] = useState("");
  const [saving, setSaving] = useState(false);

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null); // file pending crop
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: Profile) => {
        setProfile(data);
        setName(data.name ?? "");
        setHandicap(data.handicap != null ? String(data.handicap) : "");
      });
  }, []);

  // User picked a file → open cropper instead of auto-processing
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    // Reset the input so same file can be picked again later
    e.target.value = "";
  }

  // Cropper confirmed → upload the base64
  async function handleCropConfirm(base64: string) {
    setCropFile(null);
    setAvatarPreview(base64);
    setUploadingAvatar(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarBase64: base64 }),
      });
      setProfile((prev) => prev ? { ...prev, avatarBase64: base64 } : prev);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim() || null,
        handicap: handicap !== "" ? parseFloat(handicap) : null,
      }),
    });
    const updated = await res.json() as Profile;
    setProfile((prev) => prev ? { ...prev, ...updated } : prev);
    setEditing(false);
    setSaving(false);
  }

  function getTips(p: Profile): string[] {
    const tips: string[] = [];
    const processed = p.swings.filter((s) => s.status === "PROCESSED").length;

    if (p.swings.length === 0) {
      tips.push(t.tipFirstSwing);
    } else if (p.swings.length < 3) {
      tips.push(t.tipFewSwings);
    } else {
      tips.push(t.tipManySwings.replace("{count}", String(p.swings.length)));
    }

    if (p.handicap === null) {
      tips.push(t.tipNoHandicap);
    } else if (p.handicap > 18) {
      tips.push(t.tipHighHandicap);
    } else if (p.handicap <= 10) {
      tips.push(t.tipLowHandicap);
    }

    if (processed > 0) tips.push(t.tipReview);
    tips.push(t.tipAngles);
    tips.push(t.tipAddress);

    return tips.slice(0, 4);
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-green-950/75 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const avatarSrc = avatarPreview ?? profile.avatarBase64;
  const initials = getInitials(profile.name, profile.email);
  const tips = getTips(profile);
  const processedCount = profile.swings.filter((s) => s.status === "PROCESSED").length;

  const gearAction = (
    <Link
      href="/settings"
      className="p-2 rounded-xl text-green-400 hover:text-white hover:bg-green-900 transition"
      title={t.settings}
    >
      <GearIcon className="w-5 h-5" />
    </Link>
  );

  return (
    <>
      {/* Avatar crop modal */}
      {cropFile && (
        <AvatarCropper
          file={cropFile}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropFile(null)}
        />
      )}

      <main className="min-h-screen bg-green-950/75 text-white p-6 pb-24">
        <div className="max-w-lg mx-auto flex flex-col gap-6">
          <AppHeader backHref="/" backLabel={t.back} rightAction={gearAction} />

          {/* Profile card */}
          <div className="bg-green-900/60 rounded-2xl p-6 flex flex-col items-center gap-4">

            {/* Avatar with upload button */}
            <div className="relative">
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-green-700 hover:ring-green-500 transition-all focus:outline-none group relative"
                title={t.changePhoto}
              >
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-green-600 flex items-center justify-center text-2xl font-bold">
                    {initials}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-white font-medium">{t.changePhoto}</span>
                </div>
              </button>

              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {editing ? (
              <div className="w-full flex flex-col gap-3">
                <div>
                  <label className="text-xs text-green-400 mb-1 block">{t.name}</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.name}
                    className="w-full bg-green-950 border border-green-700 rounded-lg px-3 py-2 text-sm text-white placeholder-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-green-400 mb-1 block">{t.handicap}</label>
                  <input
                    type="number"
                    min="0"
                    max="54"
                    step="0.1"
                    value={handicap}
                    onChange={(e) => setHandicap(e.target.value)}
                    placeholder="e.g. 12.4"
                    className="w-full bg-green-950 border border-green-700 rounded-lg px-3 py-2 text-sm text-white placeholder-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-green-600 hover:bg-green-500 rounded-lg py-2 text-sm font-semibold disabled:opacity-50 transition"
                  >
                    {saving ? t.saving : t.save}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setName(profile.name ?? "");
                      setHandicap(profile.handicap != null ? String(profile.handicap) : "");
                    }}
                    className="flex-1 bg-green-900 hover:bg-green-800 border border-green-700 rounded-lg py-2 text-sm transition"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-xl font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>
                    {profile.name ?? t.noName}
                  </p>
                  <p className="text-green-400 text-sm mt-0.5">{profile.email}</p>
                </div>

                <div className="flex gap-6 mt-2">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-300">
                      {profile.handicap != null ? profile.handicap : "—"}
                    </p>
                    <p className="text-xs text-green-500 mt-0.5">{t.handicap}</p>
                  </div>
                  <div className="w-px bg-green-800" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-300">{profile.swings.length}</p>
                    <p className="text-xs text-green-500 mt-0.5">{t.swings}</p>
                  </div>
                  <div className="w-px bg-green-800" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-300">{processedCount}</p>
                    <p className="text-xs text-green-500 mt-0.5">{t.analysed}</p>
                  </div>
                </div>

                <button
                  onClick={() => setEditing(true)}
                  className="text-sm text-green-400 hover:text-white border border-green-700 hover:border-green-500 rounded-lg px-4 py-1.5 transition"
                >
                  {t.editProfile}
                </button>
              </>
            )}
          </div>

          {/* Tips */}
          <section>
            <h2 className="text-base font-semibold text-green-200 mb-3" style={{ fontFamily: "var(--font-playfair)" }}>
              {t.tipsForYou}
            </h2>
            <ul className="flex flex-col gap-2">
              {tips.map((tip, i) => (
                <li key={i} className="flex gap-3 bg-green-900/40 rounded-xl px-4 py-3 text-sm text-green-200">
                  <span className="text-green-500 mt-0.5">✦</span>
                  {tip}
                </li>
              ))}
            </ul>
          </section>

          {/* All swings */}
          <section>
            <h2 className="text-base font-semibold text-green-200 mb-3" style={{ fontFamily: "var(--font-playfair)" }}>
              {t.yourSwingsSection}
            </h2>
            {profile.swings.length === 0 ? (
              <p className="text-green-500 text-sm">{t.noSwingsYet}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {profile.swings.map((swing) => (
                  <li key={swing.id}>
                    <Link
                      href={`/swings/${swing.id}`}
                      className="flex items-center justify-between bg-green-900/50 hover:bg-green-800/60 rounded-xl px-4 py-3 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium capitalize">
                          {swing.clubType.toLowerCase()} swing
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            swing.status === "PROCESSED"
                              ? "bg-green-800 text-green-300"
                              : swing.status === "FAILED"
                              ? "bg-red-900 text-red-300"
                              : "bg-yellow-900 text-yellow-300"
                          }`}
                        >
                          {swing.status === "PROCESSED"
                            ? t.statusReady
                            : swing.status === "FAILED"
                            ? t.statusFailed
                            : t.statusProcessing}
                        </span>
                      </div>
                      <span className="text-xs text-green-500">
                        {new Date(swing.createdAt).toLocaleDateString(dateLocale, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="text-center text-xs text-green-700">
            {t.memberSince}{" "}
            {new Date(profile.createdAt).toLocaleDateString(dateLocale, { month: "long", year: "numeric" })}
          </p>
        </div>
      </main>
    </>
  );
}
