# CloudAce AI

**Master the Cloud. Ace the Exam.**

CloudAce AI is an independent, responsive study companion for learners preparing for Azure Fundamentals (AZ-900). The MVP brings original practice questions, saved quiz history, topic analytics, spaced-repetition flashcards, a deterministic study planner, readiness guidance, and a curated learning library into one learning loop.

> **Independent study tool:** CloudAce AI is an independent certification preparation tool. It is not affiliated with, endorsed by, or sponsored by Microsoft. Microsoft Azure and AZ-900 are referenced solely to identify the certification and related learning subject matter. Practice questions are original and are not actual exam questions.

## Problem and solution

Certification learners often have to piece together quizzes, revision cards, schedules, and progress tracking across separate tools. CloudAce AI connects those activities: quiz answers update topic performance, weak topics guide revision, reviewed cards get scheduled for another look, and the readiness page explains what the available practice data does and does not show.

## Features in this MVP

- **Dashboard:** activity-based statistics, topic performance, a score history chart, next-step recommendations, plan preview, and flashcards due. A new learner starts with empty statistics; no progress is fabricated.
- **Practice quizzes:** original, source-linked AZ-900 questions; single- and multiple-answer scoring; topic and length selection; practice or assessment mode; optional timer; question navigation and review flags; answer explanations and saved results.
- **Flashcard coach:** topic filters, flip-to-reveal cards, known/difficult/forgot ratings, a due queue, and a documented interval schedule (10 minutes, 1 day, then a growing interval capped at 30 days).
- **Study planner:** date and availability validation, 15–120 minute sessions, selected weekdays, weak-topic prioritization, and completed-session preservation on regeneration.
- **Study buddy:** an honest, offline-friendly curated answer guide for common AZ-900 topics. It does not claim to be live AI. A separately deployable authenticated Edge Function supports an optional server-side AI provider.
- **Readiness:** a **Practice Readiness Estimate**, shown only after at least 10 answers and activity in at least two topics. It is a transparent practice indicator, not a probability of passing.
- **Learning library:** topic filters, search, and direct links to official Microsoft Learn materials.
- **Responsive layout:** keyboard-visible focus, accessible labels, mobile navigation, reduced-motion support, and browser-local progress storage.

### Readiness calculation

The estimate is calculated from saved attempts using fixed weights:

- Overall practice accuracy: 35%
- Accuracy across up to the three most recent quiz attempts: 25%
- Coverage of the three AZ-900 topic groups: 20%
- Unique-question breadth (scaled to 20 distinct questions): 10%
- Performance consistency across attempts: 10%

Consistency is `100 - standard deviation` of attempt percentages, clamped at zero. It is not calculated until at least two attempts exist. The estimate requires at least 10 submitted answers and coverage in at least two topic groups. Insufficient data is explicitly shown rather than replaced with a guessed estimate.

## Architecture and project structure

```text
cloudace-ai/
├── src/
│   ├── App.tsx                  # Responsive application shell and learning routes
│   ├── index.css                # Design system and responsive styles
│   └── lib/
│       ├── content.ts           # Original AZ-900 quiz, card, and module content
│       ├── learning.ts          # Scoring, readiness, scheduling, and review rules
│       ├── learning.test.ts     # Focused domain tests
│       └── storage.ts           # Explicitly local demo persistence
├── supabase/
│   ├── functions/
│   │   ├── grade-quiz/          # Authenticated server-side trusted-key grading
│   │   └── study-buddy/         # Authenticated structured AI provider adapter
│   ├── migrations/              # PostgreSQL schema, indexes, and RLS policies
│   └── seed.sql                 # Original sample content and official source links
├── .env.example
└── README.md
```

The frontend uses React, TypeScript, Vite, Tailwind CSS, React Router, Lucide, and Recharts. Core scoring and scheduling are deterministic TypeScript domain functions. The optional Supabase schema stores shared learning content separately from user records. Quiz answer keys are in a table not readable by normal client roles; the grading Edge Function verifies the authenticated user and grades against server-held keys.

## Current demo-mode boundaries

**The running frontend is a local guest demo.** Quiz attempts, flashcard reviews, and planner data are stored in this browser's `localStorage`; they do not sync across devices or accounts. The app does not implement registration, sign-in, password reset, account deletion, or Supabase-backed frontend persistence. The database and Edge Functions are deployment scaffolding for a future authenticated mode, and the current UI does not call them.

The study buddy currently returns a small set of curated, clearly labeled guide answers. Live AI only becomes available after the authenticated Edge Function is deployed and connected to an account-enabled client. No AI API key belongs in a `VITE_` variable or browser bundle. The sample dataset is a starting point, not a complete AZ-900 course; review the latest official study guide before publishing additional content.

## Run locally

Requirements: Node.js 20.19+ and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. No environment variables or Supabase project are required for the local demo.

## Environment configuration

Copy `.env.example` to `.env.local` only when preparing a future Supabase client integration. The two `VITE_` values are public browser configuration and are not wired into the local demo yet. **Never put an AI API key, Supabase service-role key, or other server secret in a `VITE_` variable.**

For the optional Edge Functions, set secrets in the Supabase project:

```sh
supabase secrets set SUPABASE_URL="https://your-project.supabase.co" SUPABASE_ANON_KEY="your-public-anon-key" SUPABASE_SERVICE_ROLE_KEY="your-server-only-service-role-key" AI_API_URL="https://your-provider.example/v1/chat/completions" AI_API_KEY="your-server-only-provider-key" AI_MODEL="your-configured-model" ALLOWED_ORIGINS="https://your-app.example"
```

`SUPABASE_SERVICE_ROLE_KEY` is needed only by `grade-quiz`; it bypasses RLS and must remain an Edge Function secret. `study-buddy` uses the provider URL, model, and API key server-side. The provider adapter expects an OpenAI-compatible chat-completions endpoint that supports JSON-object responses. It checks the authenticated user, bounds input, times out, retries one transient provider failure, and validates the structured response. It does not persist conversation history or send profile data. Add provider-specific rate limiting before public launch.

## Database setup

Create a Supabase project and install the Supabase CLI. From this directory:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Run `supabase/seed.sql` in the linked project's SQL Editor after applying the migration (or execute it with `psql` using the project's database connection string).

The migration enables RLS on user profiles, quiz history, flashcard reviews, study plans, topic mastery, preferences, and AI conversations. Users can read only their own private records. Published reference content is publicly readable; shared-content management is restricted to an admin claim. Quiz attempts and answers can be written through the grading Edge Function rather than accepting client-supplied correctness.

Deploy the optional functions:

```sh
supabase functions deploy grade-quiz
supabase functions deploy study-buddy
```

Set `ALLOWED_ORIGINS` to the exact HTTPS origin(s) that will call the functions. The local function default permits `http://localhost:5173`.

## Checks and tests

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

The unit tests cover single- and multiple-answer scoring, spaced-repetition intervals, readiness sufficiency and weighting inputs, and study-plan date/day validation. Supabase RLS and Edge Function integration tests require a configured Supabase project and are not included in the local test suite.

## Deployment

The frontend is a Vite static site. Build it with `npm run build` and publish `dist/` on Vercel or another static host. `vercel.json` includes a history-fallback rewrite for React Router. Set the deployed origin in the Edge Function `ALLOWED_ORIGINS` secret before enabling function calls. The current demo can be deployed without a Supabase project; its local progress remains device-specific.

## Hackathon demo path

1. Open the dashboard and point out that all metrics are empty until the learner practices.
2. Start a mixed-topic practice quiz; use the flag and question navigation controls.
3. Check an answer and show its explanation and Microsoft Learn source.
4. Finish the quiz and review its saved score and answer breakdown.
5. Open the dashboard to see topic accuracy and the recommended weak area update.
6. Ask the study buddy about elasticity or shared responsibility and show its demo-mode label.
7. Flip and rate a related flashcard; explain the short review interval.
8. Create a plan for a future date and selected weekdays, then complete a session.
9. Open Readiness and explain the minimum-data gate and calculation weights.

Reset the demo through **Settings → Clear local demo data**. This deletes only the current browser's CloudAce demo state.

## Known limitations and roadmap

- Local browser storage only; no account system or cloud sync is connected.
- Supabase schema and Edge Functions are provided but require deployment and an authenticated client integration.
- The local quiz bank and learning cards are intentionally small. Content needs ongoing subject-matter review and should track the current public skills outline.
- No admin content-authoring interface, billing, notifications, offline synchronization, localization UI, or account data export/deletion workflow yet.
- Edge Functions do not yet implement persistent per-user rate limits or transactional RPC grading; function writes use compensating cleanup if a later insert fails.
- AI responses are educational study aids, not a source of official certification guidance. Follow linked official materials for current requirements.

Next work: add authenticated Supabase onboarding and cloud persistence, wire the browser client to the secure Edge Functions, expand and review the content bank, and add automated RLS/mobile end-to-end tests.
