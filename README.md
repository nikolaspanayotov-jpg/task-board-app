# task-board-app
Personal Kanban Trackboard

A shared household chore board built as an interactive kanban-style React app.

This project is designed as a task board for me and my wife to manage weekly household chores in a shared visual space. Tasks can be moved across columns like a physical board, assigned to a household member, marked as recurring, and tracked through completion.

## Current status

This is currently a frontend prototype / MVP.

It already includes:
- interactive drag-and-drop board
- household-focused chore tracking
- assignment between two people
- weekly recurring chores
- task details with subtasks, comments, labels, and attachment links
- progress tracking
- local persistence with `localStorage`
- cross-tab sync on the same device
- responsive, polished UI

It does **not** yet include:
- real multi-device sync
- backend database
- authentication
- file uploads
- live collaboration across separate devices
- production deployment pipeline

## Main use case

This app is being built as a shared home organiser for a couple to:
- plan weekly chores
- assign responsibility
- track what is in progress
- mark completed jobs
- keep notes and small task details in one place

## Features

- **Kanban board layout**
  - To Do
  - This Week
  - Done

- **Interactive task cards**
  - drag and drop between columns
  - edit and delete chores
  - priority tags
  - due dates
  - assignment badges
  - recurring weekly indicator

- **Task detail management**
  - subtasks
  - comments
  - labels
  - attachment links

- **Household workflow**
  - switch between household members
  - filter by assignee
  - show “mine” and “unassigned” tasks
  - track who completed a chore

## Tech stack

- React
- Vite
- Framer Motion
- `@dnd-kit` for drag and drop
- Lucide React icons
- shadcn/ui components
- Tailwind CSS

## Local development

Install dependencies and start the app locally:

1. `npm install`
2. `npm run dev`

To create a production build:

1. `npm run build`
2. `npm run preview`

## Project structure

- `src/App.jsx` mounts the task board
- `src/components/TaskBoardWebsite.jsx` contains the main household board UI
- `src/components/ui/` contains the local UI primitives used by the board
- `src/lib/task-board-data.js` contains the household model and local-storage persistence helpers
- `src/lib/task-board-service.js` contains task CRUD, filtering, grouping, and drag/drop state logic
- `src/lib/task-board-repository.js` selects the active data source adapter
- `src/lib/task-board-local-repository.js` keeps the browser-storage prototype behavior
- `src/lib/task-board-supabase.js` creates the Supabase client when the shared backend is enabled
- `src/lib/task-board-supabase-repository.js` handles auth, onboarding, task reads/writes, and realtime wiring for Supabase
- `supabase/migrations/001_initial_schema.sql` creates the database schema, RLS policies, and onboarding RPC functions

## Environment

Copy `.env.example` and adjust values as needed.

- `VITE_TASK_BOARD_DATA_SOURCE=local` keeps the current browser-storage prototype
- `VITE_TASK_BOARD_DATA_SOURCE=supabase` enables the Supabase repository scaffold
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are required when using the Supabase repository

The working default remains `local`. When `supabase` is enabled, the app expects the SQL migration in `supabase/migrations/001_initial_schema.sql` to be applied first.

## Supabase Flow

1. Apply `supabase/migrations/001_initial_schema.sql` in your Supabase project.
2. Create the two user accounts in Supabase Auth.
3. Set `.env` values from `.env.example`.
4. Start the app with `VITE_TASK_BOARD_DATA_SOURCE=supabase`.
5. Sign in with email/password.
6. The first user creates the household in the onboarding screen.
7. The second user joins using the household ID.

The Supabase mode now supports:

- sign in / sign out
- household creation and join onboarding
- loading household members from the database
- persisting tasks, subtasks, comments, attachments, and drag order
- realtime refresh subscriptions for shared household changes

## Current storage model

At the moment, the app stores data in browser `localStorage`.

That means:
- the board survives page refreshes
- the board syncs across tabs on the same device
- the board does **not** yet sync across different devices

## Next planned improvements

The next major step is to convert this into a real shared app using a backend such as Supabase.

Planned next steps:
1. replace `localStorage` with Supabase
2. add authentication
3. create shared household data model
4. persist drag-and-drop order in the database
5. add realtime sync between devices
6. support proper file uploads
7. deploy live with Vercel

## Project goal

The goal is to turn this into a clean, simple, genuinely useful household task board that works for two people sharing chores across phones and laptops.

## Notes for Codex / contributors

Please keep the current visual style and interaction model unless there is a strong reason to change it.

Priority for future work:
- preserve existing UI quality
- keep the app usable at every step
- make incremental safe changes
- focus on shared household functionality first

## License

Private project for now.
