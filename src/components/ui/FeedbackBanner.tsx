"use client";

type FeedbackBannerProps = {
  message: string;
  variant: "correct" | "incorrect" | "neutral" | "hint";
};

export function FeedbackBanner({ message, variant }: FeedbackBannerProps) {
  if (!message) return null;

  const styles = {
    correct: "border-emerald-500/50 bg-emerald-950/60 text-emerald-200",
    incorrect: "border-red-500/50 bg-red-950/60 text-red-200",
    neutral: "border-sky-500/50 bg-sky-950/60 text-sky-200",
    hint: "border-amber-500/50 bg-amber-950/60 text-amber-200",
  };

  const icons = {
    correct: "✓",
    incorrect: "✗",
    neutral: "→",
    hint: "💡",
  };

  return (
    <div
      className={`mt-4 rounded-xl border px-4 py-3 text-sm leading-relaxed ${styles[variant]}`}
      role="status"
    >
      <span className="mr-2 font-bold">{icons[variant]}</span>
      {message}
    </div>
  );
}

type ProgressBarProps = {
  value: number;
  label?: string;
};

export function ProgressBar({ value, label }: ProgressBarProps) {
  const pct = Math.round(Math.min(100, Math.max(0, value * 100)));
  return (
    <div className="w-full">
      {label && (
        <div className="mb-1 flex justify-between text-xs text-slate-400">
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-slate-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function StreakBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-950/80 px-3 py-1 text-sm font-medium leading-none text-orange-300 ring-1 ring-orange-500/30">
      <span className="leading-none">🔥</span>
      <span className="leading-none">{count} Day Streak</span>
    </span>
  );
}
