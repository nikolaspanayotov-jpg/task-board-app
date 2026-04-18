# AGENTS.md

## Project
Household Task Board

## Purpose
This project is a shared household chore board for me and my wife.

The app should feel like a clean, modern, interactive kanban board where chores can be moved like cards on a physical board. It should be practical enough for real weekly home use, not just a demo.

## Current app state
The current app is a React frontend prototype with a polished UI.

It already includes:
- drag-and-drop kanban board
- columns:
  - To Do
  - This Week
  - Done
- assignment between two household members
- recurring weekly chores
- subtasks
- comments
- labels
- attachment links
- progress tracking
- completed-by tracking
- local persistence with `localStorage`
- cross-tab sync on the same device
- filters for everyone / mine / unassigned / by person

## Important current limitation
The app is **not yet truly shared across devices**.

Right now it uses:
- `localStorage`
- browser tab sync on the same device

That is only a temporary prototype solution.

## Main goal
Convert this app into a real shared household task board that works for two people across separate devices.

## Required next steps
Implement these in a sensible order:

1. Replace `localStorage` with a real backend
2. Use Supabase as the backend
3. Add authentication
4. Support a shared household/workspace model
5. Persist tasks, subtasks, comments, attachments, and drag order in the database
6. Add realtime syncing across devices
7. Preserve the current UI style and interaction model as much as possible
8. Keep the app working after each change
9. Update documentation as changes are made

## Preferred stack
- React
- Tailwind CSS
- shadcn/ui
- Framer Motion
- `@dnd-kit`
- Supabase
- Vercel-ready frontend

## Current domain model
The app is built around one household with two members.

Current members:
- Nikola
- Wife

The app should evolve toward a structure like:
- households
- household_members
- tasks
- subtasks
- comments
- attachments

## Product expectations
The product should remain:
- simple
- polished
- mobile-friendly
- visually clean
- easy to use every day
- suitable for weekly home chore planning

Do not overcomplicate the UI.

## UI guidance
Keep the current design direction:
- soft modern card layout
- rounded corners
- clean spacing
- strong readability
- minimal clutter
- smooth interactions

Avoid unnecessary redesigns unless needed for functionality.

## Engineering guidance
- Make incremental changes
- Prefer safe, production-minded code
- Do not break working features unnecessarily
- Reuse the current structure where practical
- Refactor when needed, but avoid chaos
- Keep code readable and maintainable

## Priority order
Focus on this order unless there is a strong reason to change it:

1. backend integration
2. auth
3. shared data model
4. realtime sync
5. drag/drop persistence
6. attachment storage
7. deployment readiness

## Functional requirements for the shared version
The final shared version should support:
- both users seeing the same chores
- task assignment
- recurring weekly chores
- task editing
- subtasks
- comments
- attachment support
- completed-by tracking
- filtering by assignee
- persistent drag-and-drop order
- realtime updates across devices

## Notes for implementation
The current code simulates shared usage with local state and local storage.

When migrating to Supabase:
- local UI state should become a frontend view of backend data
- browser storage should no longer be the source of truth
- database structure should support future growth cleanly

## Definition of success
Success means:
- me and my wife can sign in
- both of us can open the app on different devices
- both of us see the same board
- edits sync correctly
- chores remain easy and pleasant to manage

## Contributor instruction
Before making major structural changes:
- inspect the existing codebase
- explain the migration plan briefly
- then implement in small working steps

## Documentation instruction
Whenever major changes are made:
- update `README.md`
- add setup steps
- add any required environment variables
- explain how to run the app locally
