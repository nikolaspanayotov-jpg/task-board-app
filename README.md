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
- Framer Motion
- `@dnd-kit` for drag and drop
- Lucide React icons
- shadcn/ui components
- Tailwind CSS

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
