"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const googleEnabled = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function HomePage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/course");
  }, [user, loading, router]);

  async function handleGoogle() {
    setError("");
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    if (result.status === "error") {
      setError(result.message);
      setGoogleLoading(false);
    }
    // On success the browser is redirected to Google.
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  const lessons = [
    "Discovering Ohm's Law",
    "Series Circuits",
    "Parallel Circuits",
    "Equivalent Resistance",
    "Power and Energy",
    "Circuit Challenge Lab",
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-20">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Hero */}
        <div className="text-center lg:text-left">
          <div className="text-6xl lg:text-7xl">⚡</div>
          <p className="mt-4 text-sm font-medium uppercase tracking-widest text-amber-400">
            Physics – Electric Circuits
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight lg:text-6xl">
            CircuitLab
          </h1>
          <p className="mx-auto mt-4 max-w-md leading-relaxed text-slate-400 lg:mx-0 lg:text-lg">
            Learn circuits by doing. Manipulate live simulations, get instant
            feedback, and discover Ohm&apos;s Law through experimentation—not
            videos.
          </p>

          <div className="mx-auto mt-8 max-w-sm space-y-3 lg:mx-0">
            {googleEnabled && (
              <>
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={googleLoading}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-600 bg-white py-3.5 font-semibold text-slate-800 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  <GoogleIcon />
                  {googleLoading ? "Redirecting…" : "Continue with Google"}
                </button>
                {error && <p className="text-center text-sm text-red-400">{error}</p>}
                <div className="flex items-center gap-3 py-1">
                  <span className="h-px flex-1 bg-slate-700" />
                  <span className="text-xs text-slate-400">or</span>
                  <span className="h-px flex-1 bg-slate-700" />
                </div>
              </>
            )}
            <Link
              href="/signup"
              className="block w-full rounded-2xl bg-sky-600 py-3.5 text-center font-semibold text-white shadow-lg shadow-sky-900/30 transition hover:bg-sky-500"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="block w-full rounded-2xl border border-slate-600 py-3.5 text-center font-medium text-slate-300 transition hover:border-slate-500 hover:bg-slate-800/40"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Course preview card */}
        <div className="rounded-3xl border border-slate-700/60 bg-slate-900/50 p-6 shadow-2xl shadow-slate-950/40 sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Circuits Fundamentals</h2>
            <span className="rounded-full bg-sky-950/60 px-3 py-1 text-xs font-medium text-sky-300 ring-1 ring-sky-500/30">
              6 lessons
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            A guided path from Ohm&apos;s Law to multi-step circuit design
            challenges — each lesson teaches, then tests.
          </p>
          <ul className="mt-6 space-y-2.5">
            {lessons.map((title, i) => (
              <li
                key={title}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/30 px-3 py-2.5"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-600/90 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-200">{title}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
