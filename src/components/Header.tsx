"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { StreakBadge } from "@/components/ui/FeedbackBanner";
import { dueCount, introducedConcepts } from "@/lib/review";

export function Header() {
  const { user, state, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const hasConcepts = introducedConcepts(state?.review).length > 0;
  const due = dueCount(state?.review);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href={user ? "/course" : "/"} className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <span className="font-bold tracking-tight">CircuitLab</span>
        </Link>
        {mounted && user && (
          <div className="flex items-center gap-3">
            {hasConcepts && (
              <Link
                href="/review"
                className="relative inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-950/20 px-2.5 py-1 text-xs font-medium text-violet-200 hover:border-violet-400/50 hover:bg-violet-950/40"
              >
                <span aria-hidden>🧠</span>
                <span className="hidden sm:inline">Review</span>
                {due > 0 && (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-500 px-1 text-[10px] font-bold text-white">
                    {due}
                  </span>
                )}
              </Link>
            )}
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
