# CircuitLab

**Subject: Physics – Electric Circuits**

CircuitLab is a learn-by-doing app for high school students (ages 14–18) learning introductory physics. Instead of videos and quizzes, learners manipulate live circuits—adjusting voltage and resistance, watching current and bulb brightness respond—and discover concepts like Ohm's Law through experimentation.

The app goes deep on one subject, not wide across many. The **Circuits Fundamentals** course has seven interactive lessons:

1. Discovering Ohm's Law
2. Series Circuits
3. Parallel Circuits
4. Equivalent Resistance
5. Power and Energy
6. Multiple Voltage Sources — EMF, internal resistance, series/parallel sources, and Kirchhoff's voltage law
7. Circuit Challenge Lab

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

### AI features (Phase 2 — optional)

CircuitLab has three optional AI features that are **purely additive** — the app works exactly the same with AI off:

1. **Adaptive practice** — every lesson has a "Practice more" mode that generates an endless stream of problems that get harder as you get them right, climbing to university-introductory rigor at the top tiers. The harder tiers render **genuine series-parallel networks as schematics** (e.g. a parallel pair whose combined current then flows through another resistor) and ask multi-step questions — a branch current, a node voltage, or the power dissipated deep inside the network — not just trickier wording.
2. **Smart hints** — when you're stuck on a calculation, get a grounded nudge that never reveals the answer.
3. **Explain my mistake** — a wrong numeric answer is diagnosed and explained in plain language, tuned to the specific error you made.

Every number is computed and verified by the deterministic circuit engines in `src/lib/types.ts` and `src/lib/network.ts` — the model only ever produces language, so it can't hand you a wrong answer. See [BRAINLIFT.md](./BRAINLIFT.md) for the full decision record.

To enable:

1. Add an `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`, default `gpt-4o-mini`) to `.env.local` — see `.env.local.example`.
2. Restart the dev server. The AI affordances appear automatically.

The key is read server-side only (no `NEXT_PUBLIC_` prefix) and never reaches the browser. The provider is swappable with one env var — set `AI_PROVIDER` to `openai` (default), `anthropic`, or `gemini` and supply the matching key. No code changes needed.

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
- Structured lesson content model
- Optional grounded AI (OpenAI by default; Anthropic- and Gemini-ready) — see [BRAINLIFT.md](./BRAINLIFT.md)
