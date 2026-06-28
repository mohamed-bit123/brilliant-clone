import type { SupabaseClient } from "@supabase/supabase-js";
import type { LessonProgress, UserProfile, UserState } from "@/lib/types";
import type { ReviewState } from "@/lib/review";
import { emptyReview, normalizeReview } from "@/lib/review";
import { COURSE_ID } from "@/content/course";
import { createDefaultProgress, createInitialState } from "@/lib/storage";

type LessonProgressRow = {
  lesson_id: string;
  current_step: number;
  completed: boolean;
  mastery_score: number;
  step_results: Record<string, { stepId: string; correct: boolean; attempts: number }>;
  completed_step_indices: number[];
};

export async function ensureProfile(
  supabase: SupabaseClient,
  profile: UserProfile
): Promise<void> {
  await supabase.from("profiles").upsert(
    {
      id: profile.id,
      display_name: profile.displayName,
      email: profile.email,
    },
    { onConflict: "id" }
  );
}

export async function loadStateFromSupabase(
  supabase: SupabaseClient,
  profile: UserProfile
): Promise<UserState> {
  const userId = profile.id;

  const [courseRes, streakRes, progressRes] = await Promise.all([
    supabase
      .from("course_progress")
      .select("unlocked_lessons")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("streaks")
      .select("current_streak, last_active_date")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("lesson_progress")
      .select("*")
      .eq("user_id", userId),
  ]);

  if (courseRes.error) throw courseRes.error;
  if (streakRes.error) throw streakRes.error;
  if (progressRes.error) throw progressRes.error;

  // review_state is fetched separately and tolerantly: deployments that haven't
  // run the Phase 3 migration simply fall back to an empty review schedule.
  let review: ReviewState = emptyReview();
  try {
    const reviewRes = await supabase
      .from("course_progress")
      .select("review_state")
      .eq("user_id", userId)
      .maybeSingle();
    if (!reviewRes.error && reviewRes.data?.review_state) {
      review = normalizeReview(reviewRes.data.review_state as ReviewState);
    }
  } catch {
    // column absent or query failed — keep the empty schedule
  }

  const hasRemoteData =
    courseRes.data || streakRes.data || (progressRes.data?.length ?? 0) > 0;

  if (!hasRemoteData) {
    const initial = createInitialState(profile);
    await saveStateToSupabase(supabase, initial);
    return initial;
  }

  const lessonProgress: Record<string, LessonProgress> = {};
  for (const row of (progressRes.data ?? []) as LessonProgressRow[]) {
    lessonProgress[row.lesson_id] = {
      lessonId: row.lesson_id,
      currentStep: row.current_step,
      completed: row.completed,
      masteryScore: row.mastery_score,
      stepResults: row.step_results ?? {},
      completedStepIndices: row.completed_step_indices ?? [],
    };
  }

  if (!lessonProgress["lesson-1"]) {
    lessonProgress["lesson-1"] = createDefaultProgress("lesson-1");
  }

  return {
    profile,
    lessonProgress,
    unlockedLessons: courseRes.data?.unlocked_lessons ?? ["lesson-1"],
    streak: {
      currentStreak: streakRes.data?.current_streak ?? 0,
      lastActiveDate: streakRes.data?.last_active_date ?? "",
    },
    review,
  };
}

export async function saveStateToSupabase(
  supabase: SupabaseClient,
  state: UserState
): Promise<void> {
  const userId = state.profile.id;

  await ensureProfile(supabase, state.profile);

  const progressRows = Object.values(state.lessonProgress).map((p) => ({
    user_id: userId,
    lesson_id: p.lessonId,
    current_step: p.currentStep,
    completed: p.completed,
    mastery_score: p.masteryScore,
    step_results: p.stepResults,
    completed_step_indices: p.completedStepIndices,
    updated_at: new Date().toISOString(),
  }));

  if (progressRows.length > 0) {
    const { error } = await supabase
      .from("lesson_progress")
      .upsert(progressRows, { onConflict: "user_id,lesson_id" });
    if (error) throw error;
  }

  const { error: streakError } = await supabase.from("streaks").upsert(
    {
      user_id: userId,
      current_streak: state.streak.currentStreak,
      last_active_date: state.streak.lastActiveDate || null,
    },
    { onConflict: "user_id" }
  );
  if (streakError) throw streakError;

  const { error: courseError } = await supabase.from("course_progress").upsert(
    {
      user_id: userId,
      course_id: COURSE_ID,
      unlocked_lessons: state.unlockedLessons,
    },
    { onConflict: "user_id" }
  );
  if (courseError) throw courseError;

  // Persist the spaced-repetition schedule separately and tolerantly, so a
  // missing review_state column never blocks the core progress save above.
  if (state.review) {
    try {
      await supabase
        .from("course_progress")
        .update({ review_state: state.review })
        .eq("user_id", userId);
    } catch {
      // column absent — skip; localStorage still holds the schedule
    }
  }
}
