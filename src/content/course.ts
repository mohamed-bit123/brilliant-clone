import type { Course } from "@/lib/types";
import { lesson1 } from "./lessons/lesson1";
import { lesson2 } from "./lessons/lesson2";
import { lesson3 } from "./lessons/lesson3";
import { lesson4 } from "./lessons/lesson4";
import { lesson5 } from "./lessons/lesson5";
import { lesson6 } from "./lessons/lesson6";

export const COURSE_ID = "circuits-fundamentals";

export const course: Course = {
  id: COURSE_ID,
  title: "Circuits Fundamentals",
  description:
    "Six interactive lessons from Ohm's Law to circuit design challenges.",
  lessons: [lesson1, lesson2, lesson3, lesson4, lesson5, lesson6],
};

export function getLesson(id: string) {
  return course.lessons.find((l) => l.id === id);
}

export function getNextLesson(currentId: string) {
  const idx = course.lessons.findIndex((l) => l.id === currentId);
  if (idx < 0 || idx >= course.lessons.length - 1) return null;
  return course.lessons[idx + 1];
}

export function getLessonByOrder(order: number) {
  return course.lessons.find((l) => l.order === order);
}
