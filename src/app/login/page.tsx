"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Wrong email or password.");
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-green-950 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm flex flex-col gap-4"
      >
        <h1 className="text-2xl font-bold text-green-900">GolfSwing Compare</h1>
        <p className="text-gray-500 text-sm">Sign in to your account</p>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 rounded p-2">{error}</p>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-green-700 text-white rounded-lg px-4 py-2 font-semibold hover:bg-green-800 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <a href="/register" className="text-center text-sm text-green-700 hover:underline">
          No account? Register with an invite code
        </a>
      </form>
    </main>
  );
}
