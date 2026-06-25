"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { getLesson } from "@/content/course";
import { useAuth } from "@/context/AuthContext";
import { LESSON_TOPIC } from "@/lib/ai/types";
import { PracticeSession } from "@/components/practice/PracticeSession";

export default function PracticePage() {
  const params = useParams();
  const lessonId = params.lessonId as string;
  const lesson = getLesson(lessonId);
  const { user, state, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (state && lesson && !state.unlockedLessons.includes(lesson.id)) {
      router.replace("/course");
    }
  }, [state, lesson, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-400">Loading…</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="p-8 text-center">
        <p>Lesson not found.</p>
      </div>
    );
  }

  const topic = LESSON_TOPIC[lesson.id] ?? "ohms";

  return <PracticeSession lessonId={lesson.id} topic={topic} lessonTitle={lesson.title} />;
}
