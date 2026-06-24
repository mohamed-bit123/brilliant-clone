"use client";

import { LessonEngine } from "@/components/LessonEngine";
import { getLesson } from "@/content/course";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";

export default function LessonPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;
  const lesson = getLesson(lessonId);
  const { user, state, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (
      state &&
      lesson &&
      !state.unlockedLessons.includes(lesson.id)
    ) {
      router.replace("/course");
    }
  }, [state, lesson, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-400">Loading...</p>
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

  return <LessonEngine lesson={lesson} />;
}
