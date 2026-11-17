import "server-only";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  );
}

/**
 * Supabase client for the current request, authenticated as the signed-in
 * Clerk user (Clerk third-party auth). RLS on every table scopes rows to that
 * user, so a signed-out request sees nothing.
 *
 * Usage (Server Components and Server Actions):
 *   const supabase = await getSupabase();
 */
export async function getSupabase() {
  const { getToken } = await auth();
  return createClient(url!, publishableKey!, {
    accessToken: async () => (await getToken()) ?? null,
  });
}
