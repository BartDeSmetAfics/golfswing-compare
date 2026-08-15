"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";

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

function resizeImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const SIZE = 200;
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d")!;

      // Cover crop: center the image
      const scale = Math.max(SIZE / img.width, SIZE / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);

      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function getTips(profile: Profile): string[] {
  const tips: string[] = [];
  const processed = profile.swings.filter((s) => s.status === "PROCESSED").length;

  if (profile.swings.length === 0) {
    tips.push("Record your first iron swing to get started.");
  } else if (profile.swings.length < 3) {
    tips.push("Record a few more swings to start seeing your progress over time.");
  } else {
    tips.push(`You've uploaded ${profile.swings.length} swings — keep it up to track your improvement.`);
  }

  if (profile.handicap === null) {
    tips.push("Set your handicap so you can track progress relative to your level.");
  } else if (profile.handicap > 18) {
    tips.push("Focus on consistent ball contact before working on swing shape.");
  } else if (profile.handicap <= 10) {
    tips.push("At your level, fine-tuning impact position gives the biggest gains.");
  }

  if (processed > 0) {
    tips.push("Review the frame comparisons and coaching tips for each processed swing.");
  }

  tips.push("Film from down-the-line and face-on angles for the most useful analysis.");
  tips.push("A stable address position is the foundation of every great swing.");

  return tips.slice(0, 4);
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [handicap, setHandicap] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
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

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const base64 = await resizeImageToBase64(file);
      setAvatarPreview(base64);
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

  if (!profile) {
    return (
      <main className="min-h-screen bg-green-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const avatarSrc = avatarPreview ?? profile.avatarBase64;
  const initials = getInitials(profile.name, profile.email);
  const tips = getTips(profile);
  const processedCount = profile.swings.filter((s) => s.status === "PROCESSED").length;

  return (
    <main className="min-h-screen bg-green-950 text-white p-6 pb-16">
      <div className="max-w-lg mx-auto flex flex-col gap-6">
        <AppHeader backHref="/" backLabel="Dashboard" />

        {/* Profile card */}
        <div className="bg-green-900/60 rounded-2xl p-6 flex flex-col items-center gap-4">

          {/* Avatar with upload button */}
          <div className="relative">
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-green-700 hover:ring-green-500 transition-all focus:outline-none group"
              title="Change profile photo"
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-green-600 flex items-center justify-center text-2xl font-bold">
                  {initials}
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-white font-medium">Change</span>
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
              onChange={handleAvatarChange}
            />
          </div>

          {editing ? (
            <div className="w-full flex flex-col gap-3">
              <div>
                <label className="text-xs text-green-400 mb-1 block">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-green-950 border border-green-700 rounded-lg px-3 py-2 text-sm text-white placeholder-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="text-xs text-green-400 mb-1 block">Handicap</label>
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
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setName(profile.name ?? "");
                    setHandicap(profile.handicap != null ? String(profile.handicap) : "");
                  }}
                  className="flex-1 bg-green-900 hover:bg-green-800 border border-green-700 rounded-lg py-2 text-sm transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center">
                <p className="text-xl font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>
                  {profile.name ?? "No name set"}
                </p>
                <p className="text-green-400 text-sm mt-0.5">{profile.email}</p>
              </div>

              {/* Stats row */}
              <div className="flex gap-6 mt-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-300">
                    {profile.handicap != null ? profile.handicap : "—"}
                  </p>
                  <p className="text-xs text-green-500 mt-0.5">Handicap</p>
                </div>
                <div className="w-px bg-green-800" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-300">{profile.swings.length}</p>
                  <p className="text-xs text-green-500 mt-0.5">Swings</p>
                </div>
                <div className="w-px bg-green-800" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-300">{processedCount}</p>
                  <p className="text-xs text-green-500 mt-0.5">Analysed</p>
                </div>
              </div>

              <button
                onClick={() => setEditing(true)}
                className="text-sm text-green-400 hover:text-white border border-green-700 hover:border-green-500 rounded-lg px-4 py-1.5 transition"
              >
                Edit profile
              </button>
            </>
          )}
        </div>

        {/* Tips */}
        <section>
          <h2 className="text-base font-semibold text-green-200 mb-3" style={{ fontFamily: "var(--font-playfair)" }}>
            Tips for you
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
            Your swings
          </h2>
          {profile.swings.length === 0 ? (
            <p className="text-green-500 text-sm">No swings yet.</p>
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
                        {swing.status.toLowerCase()}
                      </span>
                    </div>
                    <span className="text-xs text-green-500">
                      {new Date(swing.createdAt).toLocaleDateString("nl-BE", {
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
          Member since {new Date(profile.createdAt).toLocaleDateString("nl-BE", { month: "long", year: "numeric" })}
        </p>
      </div>
    </main>
  );
}
