import type { LessonProgress, StreakData, UserProfile, UserState } from "@/lib/types";
import { course } from "@/content/course";

const STORAGE_KEY = "circuitlab_user_state";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function createDefaultProgress(lessonId: string): LessonProgress {
  return {
    lessonId,
    currentStep: 0,
    completed: false,
    masteryScore: 0,
    stepResults: {},
    completedStepIndices: [],
  };
}

export function createInitialState(profile: UserProfile): UserState {
  return {
    profile,
    lessonProgress: {
      "lesson-1": createDefaultProgress("lesson-1"),
    },
    unlockedLessons: ["lesson-1"],
    streak: { currentStreak: 0, lastActiveDate: "" },
  };
}

export function loadUserState(): UserState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserState;
  } catch {
    return null;
  }
}

export function saveUserState(state: UserState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function updateStreak(streak: StreakData): StreakData {
  const today = todayISO();
  if (streak.lastActiveDate === today) return streak;

  const next =
    streak.lastActiveDate === yesterdayISO()
      ? streak.currentStreak + 1
      : streak.lastActiveDate === ""
        ? 1
        : 1;

  return { currentStreak: next, lastActiveDate: today };
}

export function computeMasteryScore(
  correctCount: number,
  totalCount: number
): number {
  if (totalCount === 0) return 0;
  return correctCount / totalCount;
}

export function unlockNextLesson(
  state: UserState,
  lessonId: string,
  masteryScore: number
): UserState {
  const lesson = course.lessons.find((l) => l.id === lessonId);
  if (!lesson || masteryScore < lesson.masteryThreshold) return state;

  const next = course.lessons.find((l) => l.order === lesson.order + 1);
  if (!next || state.unlockedLessons.includes(next.id)) return state;

  return {
    ...state,
    unlockedLessons: [...state.unlockedLessons, next.id],
    lessonProgress: {
      ...state.lessonProgress,
      [next.id]: state.lessonProgress[next.id] ?? createDefaultProgress(next.id),
    },
  };
}

export function getCourseCompletionCount(state: UserState): number {
  return course.lessons.filter(
    (l) => state.lessonProgress[l.id]?.completed
  ).length;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
