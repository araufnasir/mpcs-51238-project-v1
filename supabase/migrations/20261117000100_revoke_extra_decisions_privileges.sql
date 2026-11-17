-- Supabase default privileges also grant TRUNCATE, TRIGGER and REFERENCES to
-- authenticated. TRUNCATE bypasses RLS, so keep only the four CRUD privileges.
revoke truncate, trigger, references on public.decisions from authenticated;
