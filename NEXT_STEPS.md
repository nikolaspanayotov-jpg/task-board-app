# NEXT_STEPS.md

## Goal
Turn the current local-storage household chore board into a real shared app for two people using Supabase.

The current React app already includes:
- kanban board UI
- drag and drop
- household member switching
- assignment
- recurring weekly chores
- subtasks
- comments
- labels
- attachment links
- progress tracking
- completed-by tracking
- local persistence
- cross-tab sync on the same device

The next work should convert this into a true multi-device shared application.

---

## Phase 1 — Inspect and stabilise the current app

### Tasks
- inspect the current codebase and identify missing project structure
- confirm the app runs locally
- identify where the current storage logic lives
- identify reusable UI components vs data logic
- document the current task shape and state flow
- keep the current UI intact unless necessary

### Deliverables
- app runs locally
- current architecture briefly documented
- no regressions in current frontend behavior

---

## Phase 2 — Prepare the project for backend integration

### Tasks
- create a clean data access layer or service layer
- isolate localStorage usage so it can be replaced cleanly
- separate UI concerns from persistence concerns
- centralise task CRUD functions
- centralise household/member logic
- prepare environment variable support

### Deliverables
- storage logic is no longer scattered through UI components
- app is ready to swap local storage for Supabase
- `.env.example` added if needed

---

## Phase 3 — Set up Supabase

### Tasks
- install and configure Supabase client
- add environment variables for:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- create Supabase project connection code
- add setup documentation to README

### Deliverables
- Supabase client configured
- frontend can connect to Supabase
- environment setup documented

---

## Phase 4 — Design and create the database schema

### Required tables
- `households`
- `household_members`
- `tasks`
- `subtasks`
- `comments`
- `attachments`

### Suggested fields

#### households
- id
- name
- created_at

#### household_members
- id
- household_id
- user_id
- display_name
- role
- created_at

#### tasks
- id
- household_id
- title
- description
- priority
- due_date
- status
- assigned_to_user_id
- created_by_user_id
- completed_by_user_id
- completed_at
- recurring_weekly
- position
- created_at
- updated_at

#### subtasks
- id
- task_id
- text
- done
- position
- created_at

#### comments
- id
- task_id
- user_id
- text
- created_at

#### attachments
- id
- task_id
- user_id
- name
- url
- created_at

### Tasks
- create SQL or migration files
- document schema clearly
- include indexes where useful
- include sensible defaults and timestamps

### Deliverables
- schema created in Supabase
- schema committed to repo
- README updated with setup steps

---

## Phase 5 — Add authentication

### Tasks
- add Supabase Auth
- support sign in / sign out
- support two household users
- connect authenticated users to `household_members`
- remove the fake local “viewing as” model for the real shared version
- keep a simple UX

### Deliverables
- users can sign in
- user identity comes from auth, not local storage
- app knows which household the logged-in user belongs to

---

## Phase 6 — Replace local storage with database reads/writes

### Tasks
- replace `loadTasks()` and save-to-localStorage logic
- load tasks from Supabase
- create tasks in Supabase
- update tasks in Supabase
- delete tasks in Supabase
- persist subtasks, comments, and attachments in Supabase
- keep local React state only as a UI state layer

### Deliverables
- browser refresh loads data from Supabase
- both users see the same persisted data
- no dependency on localStorage for task data

---

## Phase 7 — Persist drag-and-drop order and column changes

### Tasks
- store task ordering with a `position` field
- update task `status` when moved between columns
- update `position` when reordered in a column
- ensure order persists across refreshes and devices
- keep drag experience smooth

### Deliverables
- board order is stable
- drag-and-drop changes persist in database
- order is consistent for both users

---

## Phase 8 — Add realtime sync

### Tasks
- subscribe to task changes with Supabase Realtime
- refresh local state when tasks are inserted, updated, or deleted
- sync subtasks/comments if needed
- ensure two users on different devices see live updates

### Deliverables
- edits appear on both devices without refresh
- shared board behaves like a true collaborative app

---

## Phase 9 — Upgrade attachments

### Tasks
- decide whether attachments remain URL-only or move to file uploads
- if implementing uploads, use Supabase Storage
- secure uploads appropriately
- store uploaded file references in `attachments`

### Deliverables
- attachment system works reliably
- uploaded files can be attached to chores

---

## Phase 10 — Household workflow improvements

### Tasks
- keep task assignment
- keep recurring weekly chore support
- keep completed-by tracking
- improve recurring chore UX if needed
- consider:
  - “reset weekly chores”
  - repeating task templates
  - due-today / overdue highlights
  - activity history

### Deliverables
- app feels practical for real weekly household use
- shared workflow remains simple and polished

---

## Phase 11 — Polish, test, and deploy

### Tasks
- test desktop and mobile layouts
- test two-user workflow
- test sign-in flow
- test drag-and-drop persistence
- test realtime behavior
- handle loading and error states
- prepare production deployment
- deploy frontend to Vercel

### Deliverables
- app is production-ready
- deployment instructions added
- live version available

---

## Technical rules
- preserve the current visual style where possible
- do not do an unnecessary redesign
- make incremental changes
- keep the app working after each step
- prefer clean, maintainable code
- update README when major setup changes happen

---

## Priority order
1. stabilise code structure
2. set up Supabase
3. create schema
4. add auth
5. replace local storage
6. persist drag/order changes
7. add realtime
8. upgrade attachments
9. polish and deploy

---

## Definition of done
The project is successful when:
- I can sign in
- my wife can sign in
- we both see the same household board
- changes sync across devices
- chores can be assigned, edited, moved, and completed reliably
- the app still feels simple, clean, and pleasant to use
