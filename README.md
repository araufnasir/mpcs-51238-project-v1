# Which Way

A tool that helps someone facing a big decision structure it and compare their options with a weighted scoring grid. It works for any decision type: personal, professional, or spending.

**Live:** https://mpcs-51238-project-v1.vercel.app

Built for Design, Build, Ship (MPCS 51238). See [PROPOSAL.md](PROPOSAL.md) for the original proposal.

## The core task (v1)

1. **Sign up** with Clerk.
2. **Create a decision** from **My decisions** by giving it a title. Or click **Try the car example**, which creates a decision with Buy / Lease / Transit as options and five weighted criteria (monthly cost, upfront cost, flexibility, convenience, commute time).
3. **Add options and criteria.** Give each criterion a weight from 1 to 5 for how much it matters.
4. **Rate each option from 1 to 5** on every criterion in the grid. 5 means "best for me", so for costs, cheaper gets a higher rating.
5. **See the result.**
   - Each option gets a weighted score: Σ(weight × rating) ÷ Σ(weight × 5), shown as a percentage.
   - A banner above the grid states the outcome:
     - "Best match: …" when one option leads clearly.
     - "Tie: …" when options share the top score.
     - "Too close to call: A and B" when the top two are within 5 percentage points.
     - "Rate the options below…" when nothing is rated yet.
   - Scores and the top choice only appear once there are **at least two options and one criterion**. Before that, the page asks you to add more.
6. **Save** and come back later. Your decisions are listed with the date each was last updated. A warning appears if you try to leave with unsaved changes. Decisions can be deleted.

## Tech stack

| Tool | Role |
|---|---|
| Next.js 16 (App Router) | Pages, Server Components and Server Actions |
| Tailwind CSS | Styling and responsive layout |
| Clerk | Sign-up and sign-in |
| Supabase | Postgres with row-level security; Clerk is set up as a third-party auth provider |
| Vercel | Hosting, deployed from `main` |

There is no AI model in v1. The scoring is plain code.

## How it works

- **One table.** Each row in `decisions` holds one decision: `id`, `user_id`, `title`, `data`, `created_at`, `updated_at`. Options, criteria (`{id, name, weight, kind: "rating"}`) and ratings all live in the `jsonb` `data` column. The schema is in `supabase/migrations/`.
- **Scoring is a pure function.** `src/lib/compare.ts` computes each option's weighted score (`compare`), the top option (`topOptionIds`) and the banner text (`summarize`). Tests are in `src/lib/*.test.ts`.
- **One database entry point.** All database access goes through `getSupabase()` in `src/lib/supabase.ts`. It is server-only, uses the Supabase **publishable key**, and sends the signed-in user's Clerk session token. Saved data is cleaned on the server (`src/lib/decision-data.ts`) before it is written or rendered.

## Security

- **Row-level security** is on for `decisions`. Separate select, insert, update and delete policies for `authenticated` check `auth.jwt()->>'sub' = user_id`, so each person can only reach their own rows. `user_id` is filled in from the token on insert.
- **Grants:**
  - `anon` has no grants on the table, so the publishable key alone can read nothing.
  - Supabase's default extra privileges (TRUNCATE, TRIGGER, REFERENCES) are revoked from `authenticated`.
- **No service or secret Supabase key** is used anywhere.
- **Env files:** `.env*` is git-ignored, and `.claude/settings.json` denies AI agents read and edit access to `.env` files.
- **Security review:** ran `/security-review`.
  - No high-confidence findings.
  - One medium-severity, lower-confidence finding (prototype pollution through stored decision data) was verified and fixed. Ids must now be UUIDs, stored ratings are read as own properties only, and a unit test covers the case.

## Run locally

Requires Node.js 22.18 or newer (`npm test` runs the TypeScript tests directly with Node).

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` in the project root with these four variables:

   | Variable | Where to get it |
   |---|---|
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → your app → API keys |
   | `CLERK_SECRET_KEY` | Clerk Dashboard → your app → API keys |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → Data API (project URL) |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard → Project Settings → API keys (publishable key) |

3. In Supabase, add Clerk as a third-party auth provider (Authentication → Sign In / Providers → Third-Party Auth), and turn on the Supabase integration in Clerk.
4. Apply the SQL files in `supabase/migrations/`, in filename order. Paste them into the Supabase SQL Editor, or use the Supabase CLI.
5. Run:
   ```bash
   npm run dev   # http://localhost:3000
   npm test      # unit tests for scoring and data cleaning
   ```

## Known limitations in v1

- **Ratings are judgments, not measurements.** They are 1–5 ratings, so there are no real numbers such as dollars or minutes.
- **Unrated cells are skipped.** A partially rated option can score high. A note appears when options have different numbers of ratings.
- **Back button:** the browser's Back button doesn't trigger the unsaved-changes warning.
- **Not included:** sharing, per-cell notes, and templates beyond the car example.
- **Clerk development keys:** Clerk runs on development keys, so a "Development mode" badge appears on sign-in.

## Plan for v2

**What I saw in v1:**
- Running it myself, a decision with one option and one criterion showed "100% Top choice". Fixed in v1 with a minimum-input rule.
- In the car example the top two options were 2 points apart, yet one got a green "Top choice". Fixed in v1 with a "too close to call" banner.
- 1-5 ratings are gut feelings, so they can't express real costs. The comparison Person 3 described needs real numbers.
- No outside testers yet, so these observations come from my own first run (I'll test with the people I interviewed before the Dec 1 fair):
  - I mixed up weight (how much a criterion matters) and rating (how well an option does on it). The labels don't make the difference clear enough.
  - I wasn't sure whether to rate costs as "cheaper = higher". The hint helps, but only if you read it.

**Fix first:**
- The browser Back button should trigger the unsaved-changes warning.
- Partially rated options need a clearer treatment.
- Clearer labels that separate weight (how much a criterion matters) from rating (how well an option does on it).
- A check of the grid on phone screens.

**Add:**
1. **Guided intake.** When someone names a decision (for example "which flight should I take?"), Claude asks clarifying questions (from/to, dates, budget), then what matters most, then proposes options and criteria and gives conditional recommendations ("if price matters most, A; if time, B"). Scoring stays in plain code; Claude only asks and explains. Guardrails: a spending limit set before launch, rate limits, and no invented prices.
2. **Real-number criteria** (the `kind` field is already in place; v1 only uses `"rating"`, and v2 adds `"amount"`) so costs and durations compare directly.
3. **A "What if?" row** that re-scores options with each single criterion weighted highest, with no AI needed.

**Waits:** sharing, per-cell notes, a production Clerk instance with a custom domain.

**Why:** v1 shows the structure works, but a blank grid doesn't guide people and 1-5 ratings can't carry real costs.
