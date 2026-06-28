"use client";

import { useState } from "react";
import type { StepContext } from "@/lib/ai/types";
import { requestExplanation, requestHint } from "@/lib/ai/client";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-amber-300/40 border-t-amber-300" />
  );
}

/** "Get a smart hint" — a grounded AI nudge that never reveals the answer. */
export function AIHint({ context, label = "Get a smart hint" }: { context: StepContext; label?: string }) {
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState(false);

  async function getHint() {
    setLoading(true);
    setError(false);
    try {
      const res = await requestHint(context);
      setHint(res.hint);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (hint) {
    return <FeedbackBanner message={hint} variant="hint" />;
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={getHint}
        disabled={loading}
        className="inline-flex items-center gap-2 text-sm font-medium text-amber-400 hover:text-amber-300 disabled:opacity-50"
      >
        {loading ? <Spinner /> : <span aria-hidden>✨</span>}
        {loading ? "Thinking…" : label}
      </button>
      {error && (
        <p className="mt-1 text-xs text-slate-400">
          Couldn&apos;t reach the tutor right now. Try the formula that links these quantities.
        </p>
      )}
    </div>
  );
}

/** "Explain my mistake" — diagnoses the learner's specific wrong answer. */
export function AIExplain({ context }: { context: StepContext }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ explanation: string; misconception?: string } | null>(null);
  const [error, setError] = useState(false);

  async function explain() {
    setLoading(true);
    setError(false);
    try {
      const res = await requestExplanation(context);
      setResult({ explanation: res.explanation, misconception: res.misconception });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="mt-3 rounded-xl border border-violet-500/40 bg-violet-950/40 px-4 py-3 text-sm leading-relaxed text-violet-100">
        {result.misconception && (
          <div className="mb-1 flex items-center gap-2 font-semibold text-violet-200">
            <span aria-hidden>🧭</span>
            {result.misconception}
          </div>
        )}
        <p className="whitespace-pre-line">{result.explanation}</p>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={explain}
        disabled={loading}
        className="inline-flex items-center gap-2 text-sm font-medium text-violet-300 hover:text-violet-200 disabled:opacity-50"
      >
        {loading ? <Spinner /> : <span aria-hidden>🧭</span>}
        {loading ? "Analyzing…" : "Explain my mistake"}
      </button>
      {error && (
        <p className="mt-1 text-xs text-slate-400">Couldn&apos;t reach the tutor right now.</p>
      )}
    </div>
  );
}
