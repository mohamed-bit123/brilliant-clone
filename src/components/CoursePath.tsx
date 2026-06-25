"use client";

import Link from "next/link";
import { course } from "@/content/course";
import { useAuth } from "@/context/AuthContext";
import { getCourseCompletionCount } from "@/lib/storage";
import { ProgressBar, StreakBadge } from "@/components/ui/FeedbackBanner";

export function CoursePath() {
  const { state, user } = useAuth();

  if (!user || !state) return null;

  const completedCount = getCourseCompletionCount(state);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold lg:text-3xl">{course.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">{course.description}</p>
        </div>
        <StreakBadge count={state.streak.currentStreak} />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5">
        <ProgressBar
          value={completedCount / course.lessons.length}
          label={`Course Progress · ${completedCount}/${course.lessons.length} Lessons`}
        />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {course.lessons.map((lesson) => {
          const progress = state.lessonProgress[lesson.id];
          const unlocked = state.unlockedLessons.includes(lesson.id);
          const completed = progress?.completed ?? false;
          const currentStep = progress?.currentStep ?? 0;
          const inProgress = unlocked && !completed && currentStep > 0;
          const stepPct = Math.round(
            (Math.min(currentStep, lesson.steps.length) / lesson.steps.length) * 100
          );

          return (
            <div
              key={lesson.id}
              className={`group flex flex-col rounded-2xl border p-4 transition-all sm:p-5 ${
                unlocked
                  ? completed
                    ? "border-emerald-500/40 bg-emerald-950/20 hover:-translate-y-0.5 hover:border-emerald-500/60"
                    : inProgress
                      ? "border-sky-500/40 bg-sky-950/20 hover:-translate-y-0.5 hover:border-sky-500/60"
                      : "border-slate-700 bg-slate-800/40 hover:-translate-y-0.5 hover:border-slate-500"
                  : "border-slate-700/50 bg-slate-900/40 opacity-50"
              }`}
            >
              <Link
                href={unlocked ? `/lesson/${lesson.id}` : "#"}
                className={`flex flex-col ${unlocked ? "" : "cursor-not-allowed"}`}
                onClick={(e) => !unlocked && e.preventDefault()}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      completed
                        ? "bg-emerald-600 text-white"
                        : unlocked
                          ? "bg-sky-600 text-white"
                          : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {completed ? "✓" : unlocked ? lesson.order : "🔒"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">{lesson.title}</h3>
                    <p className="text-xs text-slate-400">{lesson.description}</p>
                  </div>
                  <span
                    className={`shrink-0 text-lg transition-transform group-hover:translate-x-0.5 ${
                      unlocked ? "text-slate-500" : "text-transparent"
                    }`}
                  >
                    →
                  </span>
                </div>

                <div className="mt-3 pl-13">
                  {completed && (
                    <p className="text-xs font-medium text-emerald-400">
                      ✓ Mastered · Tap to review
                    </p>
                  )}
                  {unlocked && !completed && currentStep === 0 && (
                    <p className="text-xs text-slate-500">Ready to start</p>
                  )}
                  {inProgress && (
                    <div>
                      <p className="mb-1 text-xs text-sky-400">
                        In progress · Step {currentStep + 1}/{lesson.steps.length}
                      </p>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-700/70">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"
                          style={{ width: `${stepPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {!unlocked && (
                    <p className="text-xs text-slate-500">
                      Complete previous lesson to unlock
                    </p>
                  )}
                </div>
              </Link>

              {unlocked && (
                <Link
                  href={`/lesson/${lesson.id}/practice`}
                  className="mt-3 inline-flex items-center gap-1.5 self-start rounded-lg border border-amber-500/30 bg-amber-950/20 px-2.5 py-1 text-xs font-medium text-amber-300 hover:border-amber-400/50 hover:bg-amber-950/40"
                >
                  <span aria-hidden>✨</span> Practice more
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
