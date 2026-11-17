# Which Way

Structure a big decision (personal, professional, or spending) and compare your options with a weighted scoring grid.

**Live:** https://mpcs-51238-project-v1.vercel.app · Original proposal: [PROPOSAL.md](PROPOSAL.md)

## Core task (v1)
- Sign up, then create a decision or click **Try the car example** (Buy / Lease / Transit).
- Add options and criteria, and give each criterion a weight from 1 to 5.
- Rate each option 1–5 on each criterion (5 = best for me, so for costs, cheaper = higher).
- See each option's weighted score, Σ(weight × rating) ÷ Σ(weight × 5), plus a banner: best match, tie, or "too close to call" when the top two are within 5 points. Scores need at least 2 options and 1 criterion.
- Save, and come back later from **My decisions**.

## Tech stack
Next.js 16, Tailwind, Clerk (sign-in), Supabase (Postgres with RLS, Clerk third-party auth), Vercel. No AI model in v1.

## How it works
- **Storage:** one `decisions` table; options, criteria and ratings live in a `jsonb` `data` column.
- **Scoring:** a pure function in `src/lib/compare.ts`, with unit tests.
- **Database access:** everything goes through `getSupabase()` (`src/lib/supabase.ts`), which uses the publishable key and the user's Clerk session token.

## Security
- **RLS:** select/insert/update/delete policies check `user_id` against the Clerk user; `anon` has no grants.
- **Keys:** no service or secret Supabase key anywhere.
- **Env files:** `.env*` is git-ignored and denied to AI agents in `.claude/settings.json`.
- **Review:** `/security-review` found one medium-severity, lower-confidence issue (prototype pollution). It was fixed with UUID validation and a test.

## Run locally
1. Use Node.js 22.18+, then run `npm install`.
2. Create `.env.local` with `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (Clerk → API keys), `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Supabase → Project Settings).
3. Add Clerk as a third-party auth provider in Supabase, and turn on the Supabase integration in Clerk.
4. Apply `supabase/migrations/*.sql` in order (SQL Editor or Supabase CLI).
5. Run `npm run dev` (http://localhost:3000) and `npm test`.

## Known limitations
- **Ratings:** 1–5 judgments only, with no real numbers (dollars, minutes).
- **Unrated cells are skipped:** a partially rated option can score high; a note appears when that happens.
- **Back button:** the browser's Back button doesn't trigger the unsaved-changes warning.
- **Missing features:** no sharing, notes, or templates beyond the car example. Clerk is on development keys.

## Plan for v2
This is a plan; none of it is built yet.

**What I saw in v1** (no outside testers yet; my own first run, with interviewees to test before the Dec 1 fair):
- A decision with one option and one criterion showed "100% Top choice". Fixed with a minimum-input rule.
- In the car example the top two were 2 points apart, yet one got a green "Top choice". Fixed with a "too close to call" banner.
- 1–5 ratings are gut feelings and can't express the real costs Person 3 needed.
- I mixed up weight (how much a criterion matters) and rating (how well an option does on it).
- I wasn't sure whether "cheaper = higher" applied to costs. The hint helps only if you read it.
- v1 makes the person do all the work: they invent the options, criteria, weights and every rating. If someone already knew all that, they wouldn't need the app.
- v1 has no research behind it. Nothing tells the person what others weigh or regret for this kind of decision.
- Picking each rating from a dropdown is slow; tappable 1–5 buttons would be faster.

**Fix first:**
- The browser Back button should trigger the unsaved-changes warning.
- A clearer treatment of partially rated options.
- Clearer labels that separate weight from rating.
- Tappable 1–5 rating buttons in place of dropdowns.
- A check of the grid on phone screens.

**Add:**
1. **Research-driven guided intake.**
   - The person types one line, such as "which flight should I take?".
   - The app researches what people actually weigh and regret for that kind of decision, using web search with sources shown.
   - It then asks only 2–4 plain-language questions that would change the answer (for example, "Would you rather pay more or deal with a layover?"), each answerable in one tap.
   - It then gives conditional recommendations ("if price matters most, A; if your time does, B") with the reasons and sources.
   - The weighted grid stays as the scoring logic in plain code, behind a "show my work" link, so a new person never starts from a blank grid.
2. **Real-number criteria** so costs and durations compare directly (the `kind` field is in place; v2 adds `"amount"`).
3. **A "What if?" row** that re-scores options with each single criterion weighted highest, using plain code and no AI.

**Build order:**
1. The "What if?" row (plain code, no API key).
2. Real-number criteria.
3. Research-driven intake last, because it needs a server route, a spending limit and rate limits.

**Guardrails for the AI step:**
- A spending limit set before sharing any link.
- Per-user rate limits.
- Research cached by decision type.
- Sources summarized in my own words: no scraping forums, and no claims about sources I didn't retrieve.
- No invented prices.

**Next step before building:** run it by hand with 2–3 real decisions from the people I interviewed (research and questions done manually or in chat) to see whether the questions feel easy and the answer feels useful.

**How I'll know it works:** people I haven't coached finish a decision in a few taps, find the questions easy, and say the answer was useful. This builds on the proposal's goal of 5 real people completing a comparison.

**Risks:**
- Research quality varies by decision type.
- Model and search costs grow with use.
- A confident-sounding answer can mislead, so sources and the "show my work" view stay visible.

**Waits:** sharing, per-cell notes, a production Clerk instance with a custom domain.

**Why:** v1 shows the structure works, but a blank grid doesn't guide people, 1–5 ratings can't carry real costs, and nothing in v1 does any research for the person.
