-- Ensure extensions for UUID generation
create extension if not exists "pgcrypto";

-- Contractors table
create table if not exists public.contractors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- Document types table
create table if not exists public.doc_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  category text not null,
  is_critical boolean not null default false,
  weight numeric not null default 1
);

-- Allowed email list for onboarding
create table if not exists public.allowed_users_email (
  email text primary key
);

-- Profiles table used for role resolution
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  email text not null unique,
  role text not null check (role in ('admin','contractor')),
  contractor_id uuid references public.contractors(id) on delete set null,
  status text not null default 'invited' check (status in ('invited','active','deactivated')),
  note text,
  invited_at timestamptz default now(),
  activated_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Contractor requirements configuration
create table if not exists public.contractor_requirements (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  doc_type_id uuid not null references public.doc_types(id) on delete cascade,
  required_count integer not null default 0,
  planned_due_date date,
  constraint contractor_requirements_unique unique (contractor_id, doc_type_id)
);

-- Submissions table with storage metadata
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  doc_type_id uuid not null references public.doc_types(id) on delete cascade,
  status text not null,
  note text,
  cnt integer not null default 1,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  approved_at timestamptz,
  file_name text,
  file_size bigint,
  storage_path text
);

-- Helper functions for RLS role checks
create or replace function public.is_admin() returns boolean
language sql stable as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
      and p.status = 'active'
  );
$$;

create or replace function public.is_contractor(target_contractor uuid) returns boolean
language sql stable as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'contractor'
      and p.status = 'active'
      and p.contractor_id = target_contractor
  );
$$;

-- Enable RLS
alter table public.contractors enable row level security;
alter table public.doc_types enable row level security;
alter table public.contractor_requirements enable row level security;
alter table public.submissions enable row level security;

-- Drop existing policies if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contractors' AND policyname = 'contractors_select') THEN
    DROP POLICY "contractors_select" ON public.contractors;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doc_types' AND policyname = 'doc_types_select') THEN
    DROP POLICY "doc_types_select" ON public.doc_types;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contractor_requirements' AND policyname = 'contractor_requirements_read') THEN
    DROP POLICY "contractor_requirements_read" ON public.contractor_requirements;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contractor_requirements' AND policyname = 'contractor_requirements_admin_write') THEN
    DROP POLICY "contractor_requirements_admin_write" ON public.contractor_requirements;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'submissions' AND policyname = 'submissions_select_own') THEN
    DROP POLICY "submissions_select_own" ON public.submissions;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'submissions' AND policyname = 'submissions_contractor_modify') THEN
    DROP POLICY "submissions_contractor_modify" ON public.submissions;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'submissions' AND policyname = 'submissions_admin_full') THEN
    DROP POLICY "submissions_admin_full" ON public.submissions;
  END IF;
END$$;

-- Public read policies
create policy "contractors_select" on public.contractors for select using (true);
create policy "doc_types_select" on public.doc_types for select using (true);
create policy "contractor_requirements_read" on public.contractor_requirements for select using (true);

-- Admin modifications
create policy "contractor_requirements_admin_write" on public.contractor_requirements
  for all using (public.is_admin()) with check (public.is_admin());
create policy "submissions_admin_full" on public.submissions
  for all using (public.is_admin()) with check (public.is_admin());

-- Contractor CRUD limited to own submissions
create policy "submissions_contractor_modify" on public.submissions
  for all using (public.is_contractor(contractor_id)) with check (public.is_contractor(contractor_id));

-- Contractors can view their own submissions
create policy "submissions_select_own" on public.submissions
  for select using (
    public.is_admin() OR public.is_contractor(contractor_id)
  );

-- Views for dashboard metrics
create or replace view public.v_doc_progress as
with submission_stats as (
  select
    cr.contractor_id,
    cr.doc_type_id,
    c.name as contractor_name,
    dt.name as doc_type_name,
    dt.category,
    dt.is_critical,
    cr.required_count,
    cr.planned_due_date,
    coalesce(sum(case when s.status = 'approved' then s.cnt else 0 end), 0) as approved_count,
    min(s.created_at) as first_started_at,
    min(s.submitted_at) as first_submitted_at,
    min(s.approved_at) as first_approved_at
  from public.contractor_requirements cr
  join public.contractors c on c.id = cr.contractor_id
  join public.doc_types dt on dt.id = cr.doc_type_id
  left join public.submissions s
    on s.contractor_id = cr.contractor_id
   and s.doc_type_id = cr.doc_type_id
  group by cr.contractor_id, cr.doc_type_id, c.name, dt.name, dt.category, dt.is_critical, cr.required_count, cr.planned_due_date
)
select
  contractor_id,
  contractor_name,
  doc_type_id,
  doc_type_name,
  category,
  is_critical,
  required_count,
  approved_count,
  planned_due_date,
  case
    when required_count = 0 then 'green'
    when approved_count >= required_count then 'green'
    when planned_due_date is not null and planned_due_date < current_date then 'red'
    else 'amber'
  end as status_color,
  first_started_at,
  first_submitted_at,
  first_approved_at
from submission_stats;

create or replace view public.v_contractor_kpi as
with base as (
  select
    contractor_id,
    contractor_name,
    category,
    is_critical,
    required_count,
    approved_count,
    status_color,
    first_started_at,
    first_submitted_at,
    first_approved_at,
    case
      when first_started_at is not null and first_submitted_at is not null
        then extract(epoch from (first_submitted_at - first_started_at)) / 86400
      else null
    end as prep_days,
    case
      when first_submitted_at is not null and first_approved_at is not null
        then extract(epoch from (first_approved_at - first_submitted_at)) / 86400
      else null
    end as approval_days
  from public.v_doc_progress
)
select
  contractor_id,
  max(contractor_name) as contractor_name,
  case when sum(required_count) > 0
    then sum(approved_count)::numeric / nullif(sum(required_count), 0)
    else 0
  end as completion_ratio,
  case when count(*) filter (where is_critical) > 0
    then count(*) filter (where is_critical and approved_count >= required_count and required_count > 0)::numeric
         / nullif(count(*) filter (where is_critical), 0)
    else 0
  end as must_have_ready_ratio,
  avg(prep_days) as avg_prep_days,
  avg(approval_days) as avg_approval_days,
  sum(case when status_color = 'red' then 1 else 0 end) as red_items
from base
group by contractor_id;

-- Seed contractors
insert into public.contractors (name)
select name from (values
  ('Aurora Engineering'),
  ('Blue Horizon Services'),
  ('Crimson Logistics')
) as seed(name)
on conflict (name) do nothing;

-- Seed document types
insert into public.doc_types (name, code, category, is_critical, weight)
select * from (values
  ('Safety Management Plan', 'SMP', 'Management Systems', true, 5),
  ('Risk Assessment Register', 'RAR', 'Risk Management', true, 4),
  ('Training Competency Matrix', 'TCM', 'People', false, 3),
  ('Equipment Maintenance Logs', 'EML', 'Operations', true, 4),
  ('Environmental Monitoring Report', 'EMR', 'Environment', false, 2),
  ('Emergency Response Drill', 'ERD', 'Emergency Preparedness', true, 5)
) as seed(name, code, category, is_critical, weight)
on conflict (code) do update set
  name = excluded.name,
  category = excluded.category,
  is_critical = excluded.is_critical,
  weight = excluded.weight;

-- Helper CTEs for seeding requirements and submissions
with contractors as (
  select name, id from public.contractors
),
DOCS as (
  select code, id from public.doc_types
)
insert into public.contractor_requirements (contractor_id, doc_type_id, required_count, planned_due_date)
select c.id, d.id, req.required_count, req.planned_due_date
from (
  values
    ('Aurora Engineering','SMP',3,current_date + interval '5 day'),
    ('Aurora Engineering','RAR',2,current_date + interval '10 day'),
    ('Aurora Engineering','EML',4,current_date + interval '20 day'),
    ('Aurora Engineering','TCM',2,current_date + interval '30 day'),
    ('Blue Horizon Services','SMP',3,current_date - interval '2 day'),
    ('Blue Horizon Services','RAR',2,current_date + interval '7 day'),
    ('Blue Horizon Services','ERD',1,current_date + interval '14 day'),
    ('Crimson Logistics','SMP',3,current_date - interval '7 day'),
    ('Crimson Logistics','EML',2,current_date - interval '1 day'),
    ('Crimson Logistics','EMR',3,current_date + interval '21 day')
) as req(contractor_name, doc_code, required_count, planned_due_date)
join contractors c on c.name = req.contractor_name
join docs d on d.code = req.doc_code
on conflict (contractor_id, doc_type_id) do update set
  required_count = excluded.required_count,
  planned_due_date = excluded.planned_due_date;

-- Seed sample submissions representing varying performance
with contractors as (
  select name, id from public.contractors
),
DOCS as (
  select code, id from public.doc_types
)
insert into public.submissions (contractor_id, doc_type_id, status, note, cnt, created_at, submitted_at, approved_at, file_name, file_size, storage_path)
select c.id, d.id, s.status, s.note, s.cnt, s.created_at, s.submitted_at, s.approved_at, s.file_name, s.file_size, s.storage_path
from (
  values
    -- Aurora Engineering (strong compliance)
    ('Aurora Engineering','SMP','approved','Comprehensive SMP approved',1,current_timestamp - interval '15 day',current_timestamp - interval '14 day',current_timestamp - interval '13 day','aurora_smp.pdf',1048576,'Aurora Engineering/SMP/demo-smp.pdf'),
    ('Aurora Engineering','RAR','approved','Updated quarterly',1,current_timestamp - interval '12 day',current_timestamp - interval '11 day',current_timestamp - interval '9 day','aurora_rar.pdf',786432,'Aurora Engineering/RAR/demo-rar.pdf'),
    ('Aurora Engineering','EML','submitted','Pending final sign-off',1,current_timestamp - interval '5 day',current_timestamp - interval '4 day',null,'aurora_eml.xlsx',524288,'Aurora Engineering/EML/demo-eml.xlsx'),
    -- Blue Horizon Services (mixed)
    ('Blue Horizon Services','SMP','revision','Please address missing signatures',1,current_timestamp - interval '10 day',current_timestamp - interval '9 day',null,'blue_smp.pdf',734003,'Blue Horizon Services/SMP/demo-smp.pdf'),
    ('Blue Horizon Services','RAR','approved','Approved with conditions',1,current_timestamp - interval '8 day',current_timestamp - interval '7 day',current_timestamp - interval '5 day','blue_rar.pdf',524288,'Blue Horizon Services/RAR/demo-rar.pdf'),
    ('Blue Horizon Services','ERD','submitted','Drill report awaiting review',1,current_timestamp - interval '3 day',current_timestamp - interval '2 day',null,'blue_erd.docx',262144,'Blue Horizon Services/ERD/demo-erd.docx'),
    -- Crimson Logistics (needs attention)
    ('Crimson Logistics','SMP','submitted','Initial draft submitted late',1,current_timestamp - interval '20 day',current_timestamp - interval '2 day',null,'crimson_smp.pdf',943718,'Crimson Logistics/SMP/demo-smp.pdf'),
    ('Crimson Logistics','EML','revision','Update maintenance evidence',1,current_timestamp - interval '18 day',current_timestamp - interval '10 day',null,'crimson_eml.xlsx',314572,'Crimson Logistics/EML/demo-eml.xlsx'),
    ('Crimson Logistics','EMR','prepared','Working draft in progress',1,current_timestamp - interval '4 day',null,null,'crimson_emr.docx',157286,'Crimson Logistics/EMR/demo-emr.docx')
) as s(contractor_name, doc_code, status, note, cnt, created_at, submitted_at, approved_at, file_name, file_size, storage_path)
join contractors c on c.name = s.contractor_name
join docs d on d.code = s.doc_code
on conflict (id) do nothing;

