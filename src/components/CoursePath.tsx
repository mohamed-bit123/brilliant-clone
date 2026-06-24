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
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="mt-1 text-sm text-slate-400">{course.description}</p>
        </div>
        <StreakBadge count={state.streak.currentStreak} />
      </div>

      <ProgressBar
        value={completedCount / course.lessons.length}
        label={`Course Progress · ${completedCount}/${course.lessons.length} Lessons`}
      />

      <div className="mt-8 flex flex-col gap-3">
        {course.lessons.map((lesson) => {
          const progress = state.lessonProgress[lesson.id];
          const unlocked = state.unlockedLessons.includes(lesson.id);
          const completed = progress?.completed ?? false;
          const inProgress =
            unlocked && !completed && (progress?.currentStep ?? 0) > 0;

          return (
            <Link
              key={lesson.id}
              href={unlocked ? `/lesson/${lesson.id}` : "#"}
              className={`block rounded-2xl border p-4 transition-all ${
                unlocked
                  ? completed
                    ? "border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-500/60"
                    : inProgress
                      ? "border-sky-500/40 bg-sky-950/20 hover:border-sky-500/60"
                      : "border-slate-600 bg-slate-800/40 hover:border-slate-500"
                  : "cursor-not-allowed border-slate-700/50 bg-slate-900/40 opacity-50"
              }`}
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
                  {completed ? "✓" : lesson.order}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{lesson.title}</h3>
                  <p className="truncate text-xs text-slate-400">
                    {lesson.description}
                  </p>
                  {completed && (
                    <p className="mt-1 text-xs text-emerald-400">
                      Mastered · Tap to review
                    </p>
                  )}
                  {unlocked && !completed && (progress?.currentStep ?? 0) === 0 && (
                    <p className="mt-1 text-xs text-slate-500">Ready to start</p>
                  )}
                  {inProgress && (
                    <p className="mt-1 text-xs text-sky-400">
                      In progress · Step {(progress?.currentStep ?? 0) + 1}/
                      {lesson.steps.length}
                    </p>
                  )}
                  {!unlocked && (
                    <p className="mt-1 text-xs text-slate-500">
                      Complete previous lesson to unlock
                    </p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
