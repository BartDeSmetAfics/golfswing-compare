"use client";

import { useEffect, useState } from "react";
import { SWING_PHASES, SWING_PHASE_LABELS } from "@/lib/constants";

interface Pro {
  id: string;
  name: string;
  slug: string;
}

export default function AdminPage() {
  const [pros, setPros] = useState<Pro[]>([]);
  const [selectedPro, setSelectedPro] = useState("");
  const [selectedPhase, setSelectedPhase] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sourceNote, setSourceNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/pros")
      .then((r) => r.json())
      .then(setPros);
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPro || !selectedPhase || !file) return;

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/reference-frames", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proId: selectedPro,
          clubType: "IRON",
          phase: selectedPhase,
          sourceNote,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Upload failed");
      }

      const { uploadUrl } = await res.json() as { uploadUrl: string };

      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": "image/jpeg" },
      });

      setSuccess(`Uploaded ${selectedPhase} for ${pros.find((p) => p.id === selectedPro)?.name}`);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-green-950 text-white p-6">
      <div className="max-w-xl mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <a href="/" className="text-green-300 hover:text-white text-sm">← Dashboard</a>
          <h1 className="text-xl font-bold">Admin — reference frames</h1>
        </div>

        <p className="text-green-300 text-sm">
          Upload a screenshot of a pro&apos;s iron swing at each phase. These are the images that
          will appear next to the user&apos;s own frames.
        </p>

        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          <div>
            <label className="text-green-200 text-sm block mb-1">Pro</label>
            <select
              value={selectedPro}
              onChange={(e) => setSelectedPro(e.target.value)}
              required
              className="w-full bg-green-900 border border-green-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">Select a pro…</option>
              {pros.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-green-200 text-sm block mb-1">Swing phase</label>
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              required
              className="w-full bg-green-900 border border-green-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">Select a phase…</option>
              {SWING_PHASES.map((phase) => (
                <option key={phase} value={phase}>{SWING_PHASE_LABELS[phase]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-green-200 text-sm block mb-1">Image (JPEG screenshot)</label>
            <input
              type="file"
              accept="image/jpeg,image/jpg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
              className="w-full text-sm text-green-300 file:bg-green-700 file:text-white file:rounded-lg file:px-3 file:py-1 file:border-0 file:mr-3"
            />
          </div>

          <div>
            <label className="text-green-200 text-sm block mb-1">Source note (optional)</label>
            <input
              placeholder="e.g. YouTube: Title @ 1:32"
              value={sourceNote}
              onChange={(e) => setSourceNote(e.target.value)}
              className="w-full bg-green-900 border border-green-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>

          {success && (
            <p className="text-green-400 text-sm bg-green-900/50 rounded-xl p-3">{success}</p>
          )}
          {error && (
            <p className="text-red-400 text-sm bg-red-900/30 rounded-xl p-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={uploading || !file}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl py-3 font-semibold transition"
          >
            {uploading ? "Uploading…" : "Upload reference frame"}
          </button>
        </form>
      </div>
    </main>
  );
}
