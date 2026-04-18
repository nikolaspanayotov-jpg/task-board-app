# Supabase Setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL editor.
3. Create your two users in Supabase Auth.
4. Copy `.env.example` to `.env` and set:
   - `VITE_TASK_BOARD_DATA_SOURCE=supabase`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Sign in through the app.
6. The first signed-in user can create a household from the onboarding form.
7. The second signed-in user can join that household using the household ID.

Notes:

- The app currently supports email/password sign-in.
- The Supabase repository writes the full task graph: tasks, subtasks, comments, and attachments.
- Realtime subscriptions are enabled for the shared household tables once a household is loaded.
