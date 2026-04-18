create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'Adult',
  created_at timestamptz not null default timezone('utc', now()),
  unique (household_id, user_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  description text not null default '',
  priority text not null default 'Medium' check (priority in ('High', 'Medium', 'Low')),
  due_date date,
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  assigned_to_user_id uuid references auth.users(id) on delete set null,
  created_by_user_id uuid references auth.users(id) on delete set null,
  completed_by_user_id uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  recurring_weekly boolean not null default false,
  labels text[] not null default '{}',
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  text text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  url text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists household_members_household_id_idx on public.household_members (household_id);
create index if not exists household_members_user_id_idx on public.household_members (user_id);
create index if not exists tasks_household_id_status_position_idx on public.tasks (household_id, status, position);
create index if not exists subtasks_task_id_position_idx on public.subtasks (task_id, position);
create index if not exists comments_task_id_created_at_idx on public.comments (task_id, created_at);
create index if not exists attachments_task_id_created_at_idx on public.attachments (task_id, created_at);

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.household_members household_member
    where household_member.household_id = target_household_id
      and household_member.user_id = auth.uid()
  );
$$;

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;
alter table public.comments enable row level security;
alter table public.attachments enable row level security;

drop policy if exists households_select on public.households;
create policy households_select
on public.households
for select
to authenticated
using (public.is_household_member(id));

drop policy if exists households_insert on public.households;
create policy households_insert
on public.households
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists households_update on public.households;
create policy households_update
on public.households
for update
to authenticated
using (public.is_household_member(id))
with check (public.is_household_member(id));

drop policy if exists household_members_select on public.household_members;
create policy household_members_select
on public.household_members
for select
to authenticated
using (public.is_household_member(household_id));

drop policy if exists household_members_insert on public.household_members;
create policy household_members_insert
on public.household_members
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists household_members_update on public.household_members;
create policy household_members_update
on public.household_members
for update
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists tasks_all on public.tasks;
create policy tasks_all
on public.tasks
for all
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists subtasks_all on public.subtasks;
create policy subtasks_all
on public.subtasks
for all
to authenticated
using (
  exists (
    select 1
    from public.tasks task
    where task.id = task_id
      and public.is_household_member(task.household_id)
  )
)
with check (
  exists (
    select 1
    from public.tasks task
    where task.id = task_id
      and public.is_household_member(task.household_id)
  )
);

drop policy if exists comments_all on public.comments;
create policy comments_all
on public.comments
for all
to authenticated
using (
  exists (
    select 1
    from public.tasks task
    where task.id = task_id
      and public.is_household_member(task.household_id)
  )
)
with check (
  exists (
    select 1
    from public.tasks task
    where task.id = task_id
      and public.is_household_member(task.household_id)
  )
);

drop policy if exists attachments_all on public.attachments;
create policy attachments_all
on public.attachments
for all
to authenticated
using (
  exists (
    select 1
    from public.tasks task
    where task.id = task_id
      and public.is_household_member(task.household_id)
  )
)
with check (
  exists (
    select 1
    from public.tasks task
    where task.id = task_id
      and public.is_household_member(task.household_id)
  )
);

create or replace function public.bootstrap_household(p_household_name text, p_display_name text)
returns uuid
language plpgsql
security invoker
as $$
begin
  if auth.uid() is null then
    raise exception 'You must be authenticated to create a household.';
  end if;

  return (
    with existing_membership as (
      select household_id
      from public.household_members
      where user_id = auth.uid()
      limit 1
    ),
    inserted_household as (
      insert into public.households (name)
      select trim(p_household_name)
      where not exists (select 1 from existing_membership)
      returning id
    ),
    inserted_member as (
      insert into public.household_members (household_id, user_id, display_name, role)
      select id, auth.uid(), trim(p_display_name), 'Adult'
      from inserted_household
      returning household_id
    )
    select household_id from existing_membership
    union all
    select id from inserted_household
    limit 1
  );
end;
$$;

create or replace function public.join_household(p_household_id uuid, p_display_name text)
returns uuid
language plpgsql
security invoker
as $$
begin
  if auth.uid() is null then
    raise exception 'You must be authenticated to join a household.';
  end if;

  if not exists (select 1 from public.households where id = p_household_id) then
    raise exception 'Household not found.';
  end if;

  return (
    with existing_membership as (
      select household_id
      from public.household_members
      where user_id = auth.uid()
      limit 1
    ),
    inserted_member as (
      insert into public.household_members (household_id, user_id, display_name, role)
      select p_household_id, auth.uid(), trim(p_display_name), 'Adult'
      where not exists (select 1 from existing_membership)
      returning household_id
    )
    select household_id from existing_membership
    union all
    select household_id from inserted_member
    limit 1
  );
end;
$$;

grant execute on function public.bootstrap_household(text, text) to authenticated;
grant execute on function public.join_household(uuid, text) to authenticated;
