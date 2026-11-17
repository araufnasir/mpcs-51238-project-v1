<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Data layer

- `decisions.user_id` stores the Clerk user id (`auth.jwt()->>'sub'`, filled in by default on insert). Supabase has no users of its own here (sign-in is Clerk via third-party auth), so this column is the only link between a row and its owner, and every RLS policy checks it.
- All DB access goes through `getSupabase()` in `src/lib/supabase.ts`, which sends the Clerk session token. Publishable key only; never add a service/secret key.
