"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";

const googleEnabled = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogle() {
    setError("");
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    if (result.status === "error") {
      setError(result.message);
      setGoogleLoading(false);
    }
    // On success the browser is redirected to Google, so no further action needed.
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    if (mode === "signup") {
      const result = await signUp(email, password, displayName || email.split("@")[0]);
      setLoading(false);

      if (result.status === "verify_email") {
        setSuccessMessage(
          `We've sent a verification email to ${result.email}. Click the link in that email, then come back here to sign in.`
        );
        return;
      }
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      router.push("/course");
      return;
    }

    const result = await signIn(email, password);
    setLoading(false);

    if (result.status === "error") {
      setError(result.message);
      return;
    }
    router.push("/course");
  }

  if (successMessage) {
    return (
      <div className="space-y-4">
        <FeedbackBanner message={successMessage} variant="correct" />
        <Link
          href="/login"
          className="block w-full rounded-xl bg-sky-600 py-3 text-center font-medium text-white hover:bg-sky-500"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {googleEnabled && (
        <>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-600 bg-white py-3 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-50"
          >
            <GoogleIcon />
            {googleLoading
              ? "Redirecting…"
              : mode === "signup"
                ? "Sign up with Google"
                : "Continue with Google"}
          </button>
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-700" />
            <span className="text-xs text-slate-400">or</span>
            <span className="h-px flex-1 bg-slate-700" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "signup" && (
        <div>
          <label htmlFor="af-name" className="mb-1 block text-sm text-slate-300">
            Name
          </label>
          <input
            id="af-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus:border-sky-500"
          />
        </div>
      )}
      <div>
        <label htmlFor="af-email" className="mb-1 block text-sm text-slate-300">
          Email
        </label>
        <input
          id="af-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-slate-100 focus:border-sky-500"
        />
      </div>
      <div>
        <label htmlFor="af-password" className="mb-1 block text-sm text-slate-300">
          Password
        </label>
        <input
          id="af-password"
          type="password"
          required
          minLength={6}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-slate-100 focus:border-sky-500"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-sky-600 py-3 font-medium text-white hover:bg-sky-500 disabled:opacity-50"
      >
        {loading ? "..." : mode === "signup" ? "Create Account" : "Sign In"}
      </button>

      <p className="text-center text-sm text-slate-400">
        {mode === "signup" ? (
          <>
            Have an account?{" "}
            <Link href="/login" className="text-sky-400 underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="text-sky-400 underline">
              Create account
            </Link>
          </>
        )}
      </p>
      </form>
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
