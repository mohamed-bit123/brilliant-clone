"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallbackPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    // The AuthProvider's Supabase client automatically exchanges the OAuth code
    // in the URL for a session and then populates `user`. Redirect once that
    // happens, with a fallback to the login page if it never arrives.
    if (user) {
      router.replace("/course");
      return;
    }
    const timeout = setTimeout(() => {
      setMessage("We couldn't complete sign-in. Redirecting…");
      router.replace("/login");
    }, 8000);
    return () => clearTimeout(timeout);
  }, [user, router]);

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 px-4 py-20 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}
