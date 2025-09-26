-- Fix security issues by handling dependencies properly

-- 1. Fix RLS on allowed_users_email table  
alter table public.allowed_users_email enable row level security;

drop policy if exists "Allow authenticated users to read allowed emails" on public.allowed_users_email;
create policy "Allow authenticated users to read allowed emails" 
on public.allowed_users_email
for select to authenticated using (true);

-- 2. Fix function by recreating it with proper search path (replace, don't drop)
create or replace function public.is_allowed_email()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.allowed_users_email a
    where lower(a.email) = lower(auth.jwt() ->> 'email')
  );
$$;

-- 3. Update views to use security invoker - drop in dependency order
drop view if exists public.v_contractor_kpi;
drop view if exists public.v_doc_progress;

-- Recreate views with security invoker
create view public.v_doc_progress 
with (security_invoker=true) as
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

create view public.v_contractor_kpi 
with (security_invoker=true) as
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