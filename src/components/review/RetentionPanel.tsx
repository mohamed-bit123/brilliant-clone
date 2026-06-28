"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  CONCEPT_LABEL,
  accuracy,
  daysUntilDue,
  dueCount,
  introducedConcepts,
  isDue,
  overallRetention,
  strength,
  todayISO,
  type ConceptMemory,
} from "@/lib/review";

/**
 * Retention dashboard — the visible "effect" of spaced repetition. Shows each
 * learned concept's current memory strength, how many are due, and a CTA into
 * the Daily Review. Reads the deterministic memory model, so it reflects real
 * recall history (no AI).
 */
export function RetentionPanel() {
  const { state } = useAuth();
  if (!state) return null;

  const today = todayISO();
  const concepts = introducedConcepts(state.review);
  if (concepts.length === 0) return null; // nothing learned yet — hide entirely

  const due = dueCount(state.review, today);
  const overall = Math.round(overallRetention(state.review, today) * 100);
  const reviewedToday = state.review?.lastReviewDate === today;

  return (
    <div className="mt-6 rounded-2xl border border-violet-500/30 bg-violet-950/10 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <span aria-hidden>🧠</span> Memory &amp; Review
          </h2>
          <p className="mt-0.5 text-sm text-slate-400">
            {due > 0 ? (
              <>
                <span className="font-semibold text-violet-300">{due}</span>{" "}
                concept{due === 1 ? "" : "s"} due for review · overall retention{" "}
                <span className="font-semibold text-slate-200">{overall}%</span>
              </>
            ) : (
              <>
                All caught up{reviewedToday ? " · reviewed today" : ""} · overall
                retention <span className="font-semibold text-slate-200">{overall}%</span>
              </>
            )}
          </p>
        </div>

        <Link
          href="/review"
          className={`shrink-0 rounded-xl px-4 py-2.5 text-center text-sm font-semibold ${
            due > 0
              ? "bg-violet-600 text-white hover:bg-violet-500"
              : "border border-violet-500/40 bg-violet-950/30 text-violet-200 hover:bg-violet-950/50"
          }`}
        >
          {due > 0 ? "Start Daily Review" : "Refresh weakest"}
        </Link>
      </div>

      <ul className="mt-4 space-y-2">
        {concepts.map((m) => (
          <ConceptRow key={m.concept} mem={m} today={today} />
        ))}
      </ul>
    </div>
  );
}

function ConceptRow({ mem, today }: { mem: ConceptMemory; today: string }) {
  const s = strength(mem, today);
  const pct = Math.round(s * 100);
  const due = isDue(mem, today);
  const daysOut = daysUntilDue(mem, today);
  const acc = mem.seen > 0 ? Math.round(accuracy(mem) * 100) : null;

  const barColor =
    s >= 0.66
      ? "from-emerald-500 to-emerald-400"
      : s >= 0.33
        ? "from-amber-500 to-amber-400"
        : "from-rose-500 to-rose-400";

  const dueLabel = due
    ? "Due now"
    : daysOut === 1
      ? "Due tomorrow"
      : `Due in ${daysOut} days`;

  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="w-32 shrink-0 truncate text-slate-300 sm:w-40">
        {CONCEPT_LABEL[mem.concept]}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all`}
          style={{ width: `${Math.max(4, pct)}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-slate-400">
        {pct}%
      </span>
      <span
        className={`hidden w-24 shrink-0 text-right text-xs sm:inline ${
          due ? "font-medium text-violet-300" : "text-slate-400"
        }`}
      >
        {dueLabel}
      </span>
      {acc !== null && (
        <span className="hidden w-16 shrink-0 text-right text-xs text-slate-400 md:inline">
          {acc}% acc
        </span>
      )}
    </li>
  );
}
