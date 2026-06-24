# CircuitLab

**Subject: Physics – Electric Circuits**

CircuitLab is a learn-by-doing app for high school students (ages 14–18) learning introductory physics. Instead of videos and quizzes, learners manipulate live circuits—adjusting voltage and resistance, watching current and bulb brightness respond—and discover concepts like Ohm's Law through experimentation.

The app goes deep on one subject, not wide across many. The **Circuits Fundamentals** course has six interactive lessons:

1. Discovering Ohm's Law
2. Series Circuits
3. Parallel Circuits
4. Equivalent Resistance
5. Power and Energy
6. Circuit Challenge Lab

See [PRD.md](./PRD.md) for full product requirements, lesson specs, and build phases.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Auth & Persistence

The app works out of the box with **localStorage** (create an account with any email/password locally).

For production with cross-device sync, add Supabase credentials:

1. Copy `.env.local.example` to `.env.local`
2. Create a Supabase project and run `supabase/schema.sql`
3. Restart the dev server

### Sign in with Google

1. In **Google Cloud Console → APIs & Services → Credentials**, create an **OAuth client ID** (type: Web application).
   - Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
2. In the **Supabase dashboard → Authentication → Providers → Google**, enable Google and paste the client ID and client secret.
3. In **Authentication → URL Configuration**, set:
   - **Site URL**: `http://localhost:3000` (use your real domain in production)
   - **Redirect URLs**: add `http://localhost:3000/auth/callback`
4. The "Continue with Google" button appears automatically whenever Supabase env vars are set.

### Reset all accounts and progress

To wipe every user and start fresh, run `supabase/reset.sql` in the Supabase SQL Editor. This deletes all auth users (email/password and Google) and all saved progress.

## Deploy

Deploy to [Vercel](https://vercel.com) or any Next.js host:

```bash
npm run build
npm start
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your deployment environment for Supabase auth.

## Tech Stack

- Next.js 16, React, TypeScript, Tailwind CSS
- Supabase (optional auth & persistence)
- Structured lesson content model (no AI in Phase 1)
