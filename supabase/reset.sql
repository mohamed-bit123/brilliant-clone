-- CircuitLab — wipe all accounts and progress to start fresh
-- Run this in the Supabase SQL Editor.
--
-- WARNING: This permanently deletes ALL users and ALL learning progress.
-- There is no undo. Only run it when you intend to restart with new accounts.

-- 1. Clear app data (these also cascade-delete when users are removed,
--    but we truncate explicitly so the tables are empty even if you keep users).
truncate table
  public.lesson_progress,
  public.course_progress,
  public.streaks,
  public.profiles
restart identity cascade;

-- 2. Delete every authenticated user (email/password AND Google accounts).
--    Removing the auth.users rows cascades into the tables above as well.
delete from auth.users;
