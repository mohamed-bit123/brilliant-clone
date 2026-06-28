"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { LessonProgress, UserProfile, UserState } from "@/lib/types";
import {
  createDefaultProgress,
  createInitialState,
  loadUserState,
  saveUserState,
  unlockNextLesson,
  updateStreak,
} from "@/lib/storage";
import { getLesson } from "@/content/course";
import { LESSON_TOPIC } from "@/lib/ai/types";
import {
  isConcept,
  markReviewedToday,
  recordResult,
  type ConceptId,
} from "@/lib/review";
import { createClient } from "@/lib/supabase/client";
import {
  ensureProfile,
  loadStateFromSupabase,
  saveStateToSupabase,
} from "@/lib/supabase/progress";
import type { SignInResult, SignUpResult } from "@/lib/auth-results";
import { parseSignInError } from "@/lib/auth-results";

type AuthContextValue = {
  user: UserProfile | null;
  state: UserState | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signInWithGoogle: () => Promise<SignInResult>;
  signOut: () => Promise<void>;
  updateLessonProgress: (lessonId: string, progress: LessonProgress) => void;
  completeStep: (
    lessonId: string,
    stepIndex: number,
    correct: boolean,
    masteryScore?: number
  ) => void;
  /** Records one spaced-repetition recall result from the Daily Review. */
  recordReview: (concept: ConceptId, correct: boolean) => void;
  /** Marks that a Daily Review session ran today (for the "reviewed" signal). */
  noteReviewSession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function profileFromLocal(email: string, displayName: string): UserProfile {
  return {
    id: `local-${email}`,
    email,
    displayName,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [state, setState] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const useRemote = Boolean(supabase);

  useEffect(() => {
    async function init() {
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          const u = data.session.user;
          const profile: UserProfile = {
            id: u.id,
            email: u.email ?? "",
            displayName:
              (u.user_metadata?.display_name as string) ??
              u.email?.split("@")[0] ??
              "Learner",
          };
          setUser(profile);
          try {
            const remote = await loadStateFromSupabase(supabase, profile);
            setState(remote);
            saveUserState(remote);
          } catch {
            const saved = loadUserState();
            setState(
              saved?.profile.id === profile.id
                ? saved
                : createInitialState(profile)
            );
          }
        }

        supabase.auth.onAuthStateChange(async (_event, session) => {
          if (!session?.user) {
            setUser(null);
            setState(null);
            return;
          }
          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email ?? "",
            displayName:
              (session.user.user_metadata?.display_name as string) ??
              session.user.email?.split("@")[0] ??
              "Learner",
          };
          setUser(profile);
          try {
            const remote = await loadStateFromSupabase(supabase, profile);
            setState(remote);
            saveUserState(remote);
          } catch {
            const saved = loadUserState();
            setState(
              saved?.profile.id === profile.id
                ? saved
                : createInitialState(profile)
            );
          }
        });
      } else {
        const saved = loadUserState();
        if (saved) {
          setUser(saved.profile);
          setState(saved);
        }
      }
      setLoading(false);
    }
    init();
  }, [supabase]);

  useEffect(() => {
    if (!state) return;
    saveUserState(state);

    if (!useRemote || !supabase) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveStateToSupabase(supabase, state).catch(console.error);
    }, 500);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, supabase, useRemote]);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string): Promise<SignUpResult> => {
      if (supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        if (error) return { status: "error", message: error.message };

        if (!data.session) {
          return { status: "verify_email", email };
        }

        if (data.user) {
          const profile: UserProfile = {
            id: data.user.id,
            email,
            displayName,
          };
          setUser(profile);
          const initial = createInitialState(profile);
          setState(initial);
          try {
            await ensureProfile(supabase, profile);
            await saveStateToSupabase(supabase, initial);
          } catch (e) {
            console.error(e);
          }
        }
        return { status: "success" };
      }

      const profile = profileFromLocal(email, displayName);
      setUser(profile);
      setState(createInitialState(profile));
      return { status: "success" };
    },
    [supabase]
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<SignInResult> => {
      if (supabase) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          return {
            status: "error",
            message: parseSignInError(error.message, error.code),
          };
        }
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          const profile: UserProfile = {
            id: data.user.id,
            email: data.user.email ?? email,
            displayName:
              (data.user.user_metadata?.display_name as string) ??
              email.split("@")[0],
          };
          setUser(profile);
          try {
            const remote = await loadStateFromSupabase(supabase, profile);
            setState(remote);
          } catch {
            const saved = loadUserState();
            setState(
              saved?.profile.id === profile.id
                ? saved
                : createInitialState(profile)
            );
          }
        }
        return { status: "success" };
      }

      const saved = loadUserState();
      if (saved?.profile.email === email) {
        setUser(saved.profile);
        setState(saved);
        return { status: "success" };
      }

      const profile = profileFromLocal(email, email.split("@")[0]);
      setUser(profile);
      setState(createInitialState(profile));
      return { status: "success" };
    },
    [supabase]
  );

  const signInWithGoogle = useCallback(async (): Promise<SignInResult> => {
    if (!supabase) {
      return {
        status: "error",
        message: "Google sign-in needs Supabase configured. Add your project URL and anon key to .env.local.",
      };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) return { status: "error", message: error.message };
    return { status: "success" };
  }, [supabase]);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setState(null);
  }, [supabase]);

  const updateLessonProgress = useCallback(
    (lessonId: string, progress: LessonProgress) => {
      setState((prev) => {
        if (!prev) return prev;
        const streak = updateStreak(prev.streak);
        return {
          ...prev,
          streak,
          lessonProgress: { ...prev.lessonProgress, [lessonId]: progress },
        };
      });
    },
    []
  );

  const completeStep = useCallback(
    (
      lessonId: string,
      stepIndex: number,
      correct: boolean,
      masteryScore?: number
    ) => {
      setState((prev) => {
        if (!prev) return prev;
        const existing =
          prev.lessonProgress[lessonId] ?? createDefaultProgress(lessonId);
        const stepId = `step-${stepIndex}`;
        const attempts = (existing.stepResults[stepId]?.attempts ?? 0) + 1;

        const stepResults = {
          ...existing.stepResults,
          [stepId]: { stepId, correct, attempts },
        };

        const completedStepIndices = existing.completedStepIndices.includes(
          stepIndex
        )
          ? existing.completedStepIndices
          : [...existing.completedStepIndices, stepIndex];

        const isLastStep = masteryScore !== undefined;
        const lessonDef = getLesson(lessonId);
        const threshold = lessonDef?.masteryThreshold ?? 1;
        const passedMastery = (masteryScore ?? 0) >= threshold;

        const progress: LessonProgress = {
          ...existing,
          currentStep: isLastStep ? stepIndex : stepIndex + 1,
          completed: isLastStep ? passedMastery || existing.completed : existing.completed,
          masteryScore:
            isLastStep && masteryScore !== undefined
              ? masteryScore
              : existing.masteryScore,
          stepResults,
          completedStepIndices,
        };

        let nextState = {
          ...prev,
          streak: updateStreak(prev.streak),
          lessonProgress: { ...prev.lessonProgress, [lessonId]: progress },
        };

        if (isLastStep && passedMastery) {
          nextState = unlockNextLesson(nextState, lessonId, masteryScore!);
          // Seed this lesson's concept into the spaced-repetition schedule on
          // first mastery, so it starts surfacing for review.
          const topic = LESSON_TOPIC[lessonId];
          if (topic && isConcept(topic) && !nextState.review?.concepts[topic]) {
            nextState = {
              ...nextState,
              review: recordResult(nextState.review, topic, true),
            };
          }
        }

        return nextState;
      });
    },
    []
  );

  const recordReview = useCallback((concept: ConceptId, correct: boolean) => {
    setState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        streak: updateStreak(prev.streak),
        review: recordResult(prev.review, concept, correct),
      };
    });
  }, []);

  const noteReviewSession = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev;
      return { ...prev, review: markReviewedToday(prev.review) };
    });
  }, []);

  const value: AuthContextValue = {
    user,
    state,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateLessonProgress,
    completeStep,
    recordReview,
    noteReviewSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
