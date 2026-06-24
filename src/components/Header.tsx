"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { StreakBadge } from "@/components/ui/FeedbackBanner";

export function Header() {
  const { user, state, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href={user ? "/course" : "/"} className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <span className="font-bold tracking-tight">CircuitLab</span>
        </Link>
        {mounted && user && (
          <div className="flex items-center gap-3">
            <StreakBadge count={state?.streak.currentStreak ?? 0} />
            <span className="hidden text-sm text-slate-400 sm:inline">
              {user.displayName}
            </span>
            <button
              type="button"
              onClick={() => signOut()}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
