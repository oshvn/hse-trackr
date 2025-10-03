-- Dashboard enhancements migration
alter table public.submissions
  add column if not exists planned_date date;

create table if not exists public.critical_documents (
  doc_type_id uuid primary key references public.doc_types(id) on delete cascade
);

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
    min(s.planned_date) as planned_date,
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
  planned_date,
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
  sum(case when status_color = 'red' then 1 else 0 end) as red_items,
  case when count(*) > 0
    then 1 - (sum(case when status_color = 'red' then 1 else 0 end)::numeric / count(*))
    else 1
  end as quality_score,
  case
    when avg(approval_days) is null then 1
    else greatest(0, least(1, 7 / nullif(avg(approval_days), 0)))
  end as speed_score
from base
group by contractor_id;
