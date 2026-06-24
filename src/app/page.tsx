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

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="text-center">
        <div className="text-6xl">⚡</div>
        <p className="mt-4 text-sm font-medium uppercase tracking-widest text-amber-400">
          Physics – Electric Circuits
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">CircuitLab</h1>
        <p className="mt-4 leading-relaxed text-slate-400">
          Learn circuits by doing. Manipulate live simulations, get instant
          feedback, and discover Ohm&apos;s Law through experimentation—not
          videos.
        </p>
      </div>

      <div className="mt-10 space-y-3">
        {googleEnabled && (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-600 bg-white py-4 font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50"
            >
              <GoogleIcon />
              {googleLoading ? "Redirecting…" : "Continue with Google"}
            </button>
            {error && <p className="text-center text-sm text-red-400">{error}</p>}
            <div className="flex items-center gap-3 py-1">
              <span className="h-px flex-1 bg-slate-700" />
              <span className="text-xs text-slate-500">or</span>
              <span className="h-px flex-1 bg-slate-700" />
            </div>
          </>
        )}
        <Link
          href="/signup"
          className="block w-full rounded-2xl bg-sky-600 py-4 text-center font-semibold text-white hover:bg-sky-500"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="block w-full rounded-2xl border border-slate-600 py-4 text-center font-medium text-slate-300 hover:border-slate-500"
        >
          Sign In
        </Link>
      </div>

      <div className="mt-12 rounded-2xl border border-slate-700/60 bg-slate-900/50 p-6">
        <h2 className="font-semibold">Circuits Fundamentals</h2>
        <p className="mt-2 text-sm text-slate-400">
          6 interactive lessons from Ohm&apos;s Law to circuit design
          challenges.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-slate-300">
          <li>1. Discovering Ohm&apos;s Law</li>
          <li>2. Series Circuits</li>
          <li>3. Parallel Circuits</li>
          <li>4. Equivalent Resistance</li>
          <li>5. Power and Energy</li>
          <li>6. Circuit Challenge Lab</li>
        </ul>
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
