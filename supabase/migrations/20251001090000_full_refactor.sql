-- HSE Document Register consolidated schema + seed (idempotent)
begin;

-- Ensure crypto extensions for UUID helpers
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Master data tables ------------------------------------------------------
create table if not exists public.contractors (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null unique,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.doc_types (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  category text not null,
  is_critical boolean not null default false,
  status_color text generated always as (
    case when is_critical then 'destructive' else 'default' end
  ) stored,
  weight int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.contractor_requirements (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  doc_type_id uuid not null references public.doc_types(id) on delete cascade,
  required_count int not null default 1,
  planned_due_date date,
  note text,
  created_at timestamptz not null default now(),
  unique(contractor_id, doc_type_id)
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  doc_type_id uuid not null references public.doc_types(id) on delete cascade,
  status text not null check (status in ('prepared','submitted','approved','rejected','revision')),
  cnt int not null default 1,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  approved_at timestamptz,
  note text,
  updated_at timestamptz not null default now()
);

create table if not exists public.allowed_users_email (
  email text primary key
);

create unique index if not exists idx_allowed_users_email_lower
  on public.allowed_users_email (lower(email));

-- Helper functions --------------------------------------------------------
create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where user_id = auth.uid() and status = 'active'),
    'guest'
  );
$$;

create or replace function public.current_contractor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select contractor_id
  from public.profiles
  where user_id = auth.uid()
    and status = 'active'
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.current_app_role() = 'admin';
$$;

-- Seed data ---------------------------------------------------------------
insert into public.allowed_users_email(email)
values
  ('guest@osh.vn'),
  ('admin@osh.vn')
on conflict (email) do nothing;

insert into public.contractors(code, name) values
  ('CON-A', 'Contractor A'),
  ('CON-B', 'Contractor B'),
  ('CON-C', 'Contractor C')
on conflict (code) do update set name = excluded.name;

insert into public.doc_types(code, name, category, is_critical, weight) values
  ('MT_CM','Construction Manager','Management Teams', true, 3),
  ('MT_HSE','HSE Manager','Management Teams', true, 3),
  ('MT_PM','Project Manager','Management Teams', true, 3),
  ('MT_SM','Site Manager','Management Teams', true, 2),
  ('MT_SV','Supervisors','Management Teams', true, 2),
  ('MP','Management Plan','Management Plans', true, 4),
  ('EQ','Equipment Register','Management Plans', false, 2),
  ('IT_DOC','Training Records','Workforce', true, 3),
  ('IT_SIG','Attendance Signatures','Workforce', false, 1),
  ('RA','Risk Assessment','Risk Management', true, 4),
  ('JHA','Job Hazard Analysis','Risk Management', true, 4),
  ('SMS','Safe Method Statement','Operations', true, 4),
  ('ERP_TR','ERP Training','Emergency Response', true, 3),
  ('ERP_DR','Emergency Drills','Emergency Response', true, 3),
  ('ERP_EQ','Emergency Equipment Check','Emergency Response', true, 2)
on conflict (code) do update set
  name = excluded.name,
  category = excluded.category,
  is_critical = excluded.is_critical,
  weight = excluded.weight;

insert into public.contractor_requirements(contractor_id, doc_type_id, required_count, planned_due_date)
select c.id, d.id, 1,
       current_date + (5 + (random() * 20)::int)
from public.contractors c
cross join public.doc_types d
on conflict (contractor_id, doc_type_id) do nothing;

-- Seed submissions to create demo progress -------------------------------------------------
with contractor_lookup as (
  select code, id from public.contractors
), doc_lookup as (
  select code, id from public.doc_types
)
insert into public.submissions(contractor_id, doc_type_id, status, cnt, created_at, submitted_at, approved_at)
select cl.id, dl.id, 'approved', 1,
       now() - interval '12 days',
       now() - interval '10 days',
       now() - interval '9 days'
from contractor_lookup cl
join doc_lookup dl on dl.code in ('MT_CM','MT_HSE','MT_PM','MT_SM','RA','JHA')
where cl.code = 'CON-A'
on conflict do nothing;

insert into public.submissions(contractor_id, doc_type_id, status, cnt, created_at, submitted_at)
select cl.id, dl.id, 'submitted', 1,
       now() - interval '8 days',
       now() - interval '2 days'
from contractor_lookup cl
join doc_lookup dl on dl.code in ('MT_CM','MT_HSE','RA')
where cl.code = 'CON-B'
on conflict do nothing;

insert into public.submissions(contractor_id, doc_type_id, status, cnt, created_at)
select cl.id, dl.id, 'prepared', 1,
       now() - interval '6 days'
from contractor_lookup cl
join doc_lookup dl on dl.code in ('MT_CM','SMS')
where cl.code = 'CON-C'
on conflict do nothing;

insert into public.submissions(contractor_id, doc_type_id, status, cnt, created_at, submitted_at)
select cl.id, dl.id, 'rejected', 1,
       now() - interval '7 days',
       now() - interval '6 days'
from contractor_lookup cl
join doc_lookup dl on dl.code = 'IT_SIG'
where cl.code = 'CON-C'
on conflict do nothing;

commit;

-- Analytical views -------------------------------------------------------
create or replace view public.v_doc_progress as
with agg as (
  select
    cr.contractor_id,
    cr.doc_type_id,
    sum(case when s.status = 'approved' then s.cnt else 0 end) as approved_count,
    min(s.created_at) as first_started_at,
    min(s.submitted_at) as first_submitted_at,
    min(s.approved_at) as first_approved_at
  from public.contractor_requirements cr
  left join public.submissions s
    on s.contractor_id = cr.contractor_id
   and s.doc_type_id = cr.doc_type_id
  group by cr.contractor_id, cr.doc_type_id
)
select
  c.id as contractor_id,
  c.name as contractor_name,
  d.id as doc_type_id,
  d.name as doc_type_name,
  d.category,
  d.is_critical,
  cr.required_count,
  cr.planned_due_date,
  coalesce(a.approved_count, 0) as approved_count,
  a.first_started_at,
  a.first_submitted_at,
  a.first_approved_at,
  case
    when d.is_critical and coalesce(a.approved_count, 0) = 0 and cr.planned_due_date is not null and current_date > cr.planned_due_date then 'red'
    when d.is_critical and coalesce(a.approved_count, 0) = 0 and cr.planned_due_date is not null and current_date >= cr.planned_due_date - interval '3 days' then 'amber'
    when coalesce(a.approved_count, 0) >= cr.required_count then 'green'
    else 'amber'
  end as status_color
from public.contractor_requirements cr
join public.contractors c on c.id = cr.contractor_id
join public.doc_types d on d.id = cr.doc_type_id
left join agg a on a.contractor_id = cr.contractor_id and a.doc_type_id = cr.doc_type_id;

create or replace view public.v_contractor_kpi as
select
  contractor_id,
  contractor_name,
  sum(approved_count)::numeric / nullif(sum(required_count), 0) as completion_ratio,
  sum(case when is_critical and approved_count >= required_count then 1 else 0 end)::numeric / nullif(sum(case when is_critical then 1 else 0 end), 0) as must_have_ready_ratio,
  avg(extract(epoch from (first_submitted_at - first_started_at)) / 86400.0) as avg_prep_days,
  avg(extract(epoch from (first_approved_at - first_submitted_at)) / 86400.0) as avg_approval_days,
  sum(case when status_color = 'red' then 1 else 0 end) as red_items
from public.v_doc_progress
group by contractor_id, contractor_name;

-- Row level security -----------------------------------------------------
alter table public.contractors enable row level security;
alter table public.doc_types enable row level security;
alter table public.contractor_requirements enable row level security;
alter table public.submissions enable row level security;

-- Contractors policies
drop policy if exists contractors_select on public.contractors;
drop policy if exists contractors_admin_write on public.contractors;

create policy contractors_select on public.contractors
for select
using (public.current_app_role() in ('admin', 'contractor', 'guest'));

create policy contractors_admin_write on public.contractors
for all using (public.is_admin())
with check (public.is_admin());

-- Doc types policies
drop policy if exists doc_types_select on public.doc_types;
drop policy if exists doc_types_admin_write on public.doc_types;

create policy doc_types_select on public.doc_types
for select
using (public.current_app_role() in ('admin', 'contractor', 'guest'));

create policy doc_types_admin_write on public.doc_types
for all using (public.is_admin())
with check (public.is_admin());

-- Contractor requirements policies
drop policy if exists contractor_requirements_select on public.contractor_requirements;
drop policy if exists contractor_requirements_admin_write on public.contractor_requirements;

create policy contractor_requirements_select on public.contractor_requirements
for select
using (
  public.is_admin()
  or (
    public.current_app_role() = 'contractor'
    and contractor_id = public.current_contractor_id()
  )
);

create policy contractor_requirements_admin_write on public.contractor_requirements
for all using (public.is_admin())
with check (public.is_admin());

-- Submissions policies
drop policy if exists submissions_select on public.submissions;
drop policy if exists submissions_insert_self on public.submissions;
drop policy if exists submissions_update_self on public.submissions;
drop policy if exists submissions_admin_write on public.submissions;

create policy submissions_select on public.submissions
for select
using (
  public.is_admin()
  or (
    public.current_app_role() = 'contractor'
    and contractor_id = public.current_contractor_id()
  )
);

create policy submissions_insert_self on public.submissions
for insert
with check (
  public.is_admin()
  or (
    public.current_app_role() = 'contractor'
    and contractor_id = public.current_contractor_id()
  )
);

create policy submissions_update_self on public.submissions
for update
using (
  public.current_app_role() = 'contractor'
  and contractor_id = public.current_contractor_id()
)
with check (
  public.current_app_role() = 'contractor'
  and contractor_id = public.current_contractor_id()
);

create policy submissions_admin_write on public.submissions
for all using (public.is_admin())
with check (public.is_admin());

