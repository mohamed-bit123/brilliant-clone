-- CircuitLab Supabase schema
-- Run in Supabase SQL editor when deploying with Supabase auth

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text not null,
  created_at timestamptz default now()
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  current_step int not null default 0,
  completed boolean not null default false,
  mastery_score float not null default 0,
  step_results jsonb not null default '{}',
  completed_step_indices int[] not null default '{}',
  updated_at timestamptz default now(),
  unique(user_id, lesson_id)
);

create table if not exists public.streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  last_active_date date
);

create table if not exists public.course_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  course_id text not null default 'circuits-fundamentals',
  unlocked_lessons text[] not null default array['lesson-1']
);

alter table public.profiles enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.streaks enable row level security;
alter table public.course_progress enable row level security;

create policy "Users manage own profile" on public.profiles
  for all using (auth.uid() = id);

create policy "Users manage own progress" on public.lesson_progress
  for all using (auth.uid() = user_id);

create policy "Users manage own streaks" on public.streaks
  for all using (auth.uid() = user_id);

create policy "Users manage own course progress" on public.course_progress
  for all using (auth.uid() = user_id);
