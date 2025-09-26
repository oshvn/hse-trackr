-- =========================
-- SCHEMA & SEED (IDEMPOTENT)
-- =========================
begin;

-- Nhà thầu
create table if not exists public.contractors(
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- Loại hồ sơ (gồm nhóm cha/mô tả; đánh dấu critical)
create table if not exists public.doc_types(
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  category text not null,
  is_critical boolean not null default false,
  weight int not null default 1
);

-- Nhu cầu hồ sơ theo nhà thầu (kế hoạch)
create table if not exists public.contractor_requirements(
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  doc_type_id   uuid not null references public.doc_types(id) on delete cascade,
  required_count int not null default 1,
  planned_due_date date,
  unique(contractor_id, doc_type_id)
);

-- Nộp & phê duyệt hồ sơ (thực tế)
create table if not exists public.submissions(
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  doc_type_id   uuid not null references public.doc_types(id) on delete cascade,
  status text not null check (status in ('prepared','submitted','approved','rejected','revision')),
  cnt int not null default 1,
  created_at timestamptz not null default now(),      -- bắt đầu soạn
  submitted_at timestamptz,                           -- gửi chính thức
  approved_at  timestamptz,                           -- được duyệt
  note text
);

-- Whitelist + is_allowed_email() để SELECT chung qua user guest
create table if not exists public.allowed_users_email(
  email text primary key
);
create unique index if not exists idx_allowed_users_email_lower
  on public.allowed_users_email(lower(email));

create or replace function public.is_allowed_email()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.allowed_users_email a
    where lower(a.email) = lower(auth.jwt() ->> 'email')
  );
$$;

-- Seed whitelist: user guest
insert into public.allowed_users_email(email)
values ('guest@example.com')
on conflict (email) do nothing;

-- Seed 3 nhà thầu
insert into public.contractors(name) values
 ('Contractor A'), ('Contractor B'), ('Contractor C')
on conflict(name) do nothing;

-- Seed các loại hồ sơ (tham chiếu hình & yêu cầu)
insert into public.doc_types(code, name, category, is_critical) values
 ('MT_CM','Construction manager','1.1.1 Management Teams', true),
 ('MT_HSE','HSE Manager','1.1.1 Management Teams', true),
 ('MT_PM','Project Manager','1.1.1 Management Teams', true),
 ('MT_SM','Site Manager','1.1.1 Management Teams', true),
 ('MT_SV','Supervisors','1.1.1 Management Teams', true),
 ('MP','Management Plan','1.1.2 Management Plan', true),
 ('EQ','Equipments','1.1.3 Equipments', true),
 ('IT_DOC','Workers Regulation Documents','1.1.4 Internal Training & Workers', true),
 ('IT_SIG','Attendees Signatures','1.1.4 Internal Training & Workers', true),
 ('IT_TEST','Test','1.1.4 Internal Training & Workers', true),
 ('IT_PIC','Evidence picture','1.1.4 Internal Training & Workers', false),
 ('RA','Risk Assessment','1.2 Risk Assessment', true),
 ('JHA','JHA','1.3 JHA', true),
 ('SMS','Safe Method Statement','1.4 Safe Method Statement', true),
 ('ERP_TR','ERP Training','1.5 Emergency Action Plan', true),
 ('ERP_DR','Emergency Drills','1.5 Emergency Action Plan', true),
 ('ERP_EQ','Emergency Equipment Check','1.5 Emergency Action Plan', true)
on conflict(code) do nothing;

-- Lập yêu cầu cần nộp cho mỗi nhà thầu (mặc định 1 bộ/loại, hạn random quanh 10-20 ngày)
insert into public.contractor_requirements(contractor_id, doc_type_id, required_count, planned_due_date)
select c.id, d.id, 1, (current_date + ((10 + (random()*10)::int))::int)
from contractors c cross join doc_types d
on conflict (contractor_id, doc_type_id) do nothing;

-- Một ít dữ liệu thực tế cho demo (A tiến độ tốt hơn)
-- A: duyệt xong phần Management Teams + 1 số mục khác
insert into public.submissions(contractor_id, doc_type_id, status, cnt, created_at, submitted_at, approved_at)
select c.id, d.id, 'approved', 1, now()-interval '9 days', now()-interval '7 days', now()-interval '6 days'
from contractors c
join doc_types d on d.code in ('MT_CM','MT_HSE','MT_PM','MT_SM','MT_SV','RA','JHA')
where c.name='Contractor A';

-- B: mới nộp / đang chờ
insert into public.submissions(contractor_id, doc_type_id, status, cnt, created_at, submitted_at)
select c.id, d.id, 'submitted', 1, now()-interval '6 days', now()-interval '2 days'
from contractors c
join doc_types d on d.code in ('MT_CM','MT_HSE','RA','JHA')
where c.name='Contractor B';

-- C: chưa làm nhiều, có 1 rejected
insert into public.submissions(contractor_id, doc_type_id, status, cnt, created_at, submitted_at)
select c.id, d.id, 'prepared', 1, now()-interval '5 days', null
from contractors c
join doc_types d on d.code in ('MT_CM','RA','SMS')
where c.name='Contractor C';

insert into public.submissions(contractor_id, doc_type_id, status, cnt, created_at, submitted_at)
select c.id, d.id, 'rejected', 1, now()-interval '7 days', now()-interval '6 days'
from contractors c
join doc_types d on d.code = 'IT_SIG'
where c.name='Contractor C';

-- View tổng hợp tiến độ từng loại hồ sơ / nhà thầu
create or replace view public.v_doc_progress as
with agg as (
  select
    cr.contractor_id,
    cr.doc_type_id,
    sum(case when s.status='approved' then s.cnt else 0 end) as approved_count,
    min(s.created_at)  as first_started_at,
    min(s.submitted_at) as first_submitted_at,
    min(s.approved_at)  as first_approved_at
  from contractor_requirements cr
  left join submissions s
    on s.contractor_id = cr.contractor_id and s.doc_type_id = cr.doc_type_id
  group by cr.contractor_id, cr.doc_type_id
)
select
  c.id as contractor_id, c.name as contractor_name,
  d.id as doc_type_id, d.name as doc_type_name, d.category, d.is_critical,
  cr.required_count, cr.planned_due_date,
  coalesce(a.approved_count,0) as approved_count,
  a.first_started_at, a.first_submitted_at, a.first_approved_at,
  case
    when d.is_critical and coalesce(a.approved_count,0)=0 and current_date > cr.planned_due_date then 'red'
    when d.is_critical and coalesce(a.approved_count,0)=0 and current_date >= cr.planned_due_date - interval '3 days' then 'amber'
    when coalesce(a.approved_count,0) >= cr.required_count then 'green'
    else 'amber'
  end as status_color
from contractor_requirements cr
join contractors c on c.id = cr.contractor_id
join doc_types d   on d.id = cr.doc_type_id
left join agg a    on a.contractor_id = cr.contractor_id and a.doc_type_id = cr.doc_type_id;

-- View KPI nhà thầu
create or replace view public.v_contractor_kpi as
select
  contractor_id,
  contractor_name,
  sum(approved_count)::numeric / nullif(sum(required_count),0) as completion_ratio,
  sum(case when is_critical then case when approved_count>0 then 1 else 0 end else 0 end)::numeric
    / nullif(sum(case when is_critical then 1 else 0 end),0) as must_have_ready_ratio,
  avg(extract(epoch from (first_submitted_at - first_started_at))/86400.0) as avg_prep_days,
  avg(extract(epoch from (first_approved_at - first_submitted_at))/86400.0) as avg_approval_days,
  sum(case when status_color='red' then 1 else 0 end) as red_items
from v_doc_progress
group by contractor_id, contractor_name;

commit;

-- ============ RLS (guest có thể xem; ghi chỉ dùng cho demo) ============
-- Cho phép authenticated (guest) SELECT
alter table public.contractors enable row level security;
alter table public.doc_types enable row level security;
alter table public.contractor_requirements enable row level security;
alter table public.submissions enable row level security;

drop policy if exists "read_members_contractors" on public.contractors;
drop policy if exists "read_members_doc_types" on public.doc_types;
drop policy if exists "read_members_requirements" on public.contractor_requirements;
drop policy if exists "read_members_submissions" on public.submissions;

create policy "read_members_contractors" on public.contractors
for select to authenticated using (public.is_allowed_email());

create policy "read_members_doc_types" on public.doc_types
for select to authenticated using (public.is_allowed_email());

create policy "read_members_requirements" on public.contractor_requirements
for select to authenticated using (public.is_allowed_email());

create policy "read_members_submissions" on public.submissions
for select to authenticated using (public.is_allowed_email());