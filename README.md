# HSE Document Register

A Lovable + Supabase reference implementation for managing Health, Safety & Environment (HSE) document registers across multiple contractors. The application provides an auto-guest dashboard, contractor submission workspace, and admin tooling for approvals, user/role management, and configuration of required document types.

## Features

- **Auto guest onboarding** – visitors are transparently signed in with a read-only guest account and dropped straight into the KPI dashboard.
- **Role based routing** – dedicated experiences for guest, contractor, and admin roles with protected routes and contextual navigation.
- **Dashboard analytics** - single-screen overview with KPI strip, critical alerts, category drilldown, planned vs actual timeline, contractor leaderboard, and issue snapshot table.
- **Contractor workspace** – upload, track, and refresh submission status scoped to the contractor’s portfolio.
- **Admin console** – approvals queue, user & role management, and document type configuration with support for critical must-have tracking.
- **Supabase native** – schema, RLS policies, and seeds provided as idempotent SQL for quick bootstrap of local or hosted projects.

## Tech stack

- React 18 + TypeScript using Vite
- shadcn/ui & Tailwind CSS for styling
- TanStack Query for data fetching and caching
- Recharts for responsive data visualisations
- Supabase (PostgreSQL + Auth + Storage)

## Project structure

```
src/
  components/
    Charts/                        # Recharts visualisations
    dashboard/
      DashboardHeader.tsx          # Clock + date banner
      CriticalAlertsCard.tsx       # Red/amber must-have alerts
      CategoryProgressChart.tsx    # Category completion stacked bars
      PlannedVsActualCompact.tsx   # Planned vs actual comparator
      SnapshotTable.tsx            # Issue snapshot table
      MustHaveSplitChart.tsx       # Must-have vs standard mix
      KpiCards.tsx                 # KPI strip
    layout/                        # App shell, sidebar, header
  helpers/
    suggestActions.ts              # Suggested actions helper logic
  hooks/
    useSessionRole.tsx             # Session/profile resolver with role helpers
  lib/
    autoGuest.ts                   # Guest session bootstrapper
    supabase.ts                    # Supabase client bootstrap
  pages/
    dashboard.tsx                  # Public & admin dashboard
    login.tsx                      # Contractor/admin login form
    forgot-password.tsx            # Reset password + forced update flow
    my-submissions.tsx             # Contractor workspace
    admin/                         # Admin routes (approvals, settings, users)
```

Supabase migrations live under `supabase/migrations`. The consolidated refactor migration is `20251015093000_hse_register_refactor.sql`.

## Prerequisites

- Node.js 18+
- npm 9+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (optional but recommended for running migrations locally)

## Environment variables

Create a `.env.local` file (or configure your hosting environment) with the following variables:

```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_GUEST_EMAIL=guest@osh.vn
VITE_GUEST_PASSWORD=<guest-password>
```

For server-triggered migrations the service role key is also required:

```
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

> **Note:** The guest account must exist in Supabase Auth and remain read-only. The provided migration seeds an email allow-list entry; create the actual auth user via the Supabase dashboard or CLI.

## Getting started

```bash
npm install
npm run dev
```

The dev server runs on [http://localhost:5173](http://localhost:5173). The app automatically signs you in as the guest user unless an authenticated contractor/admin session already exists.

## Database setup

1. **Create a Supabase project** and copy the project URL + anon key.
2. **Apply migrations** (using Supabase CLI):

   ```bash
   supabase db push
   # or manually run supabase/migrations/20251015093000_hse_register_refactor.sql
   ```

3. **Seed demo data** – the migration inserts:
   - Contractors `Aurora Engineering`, `Blue Horizon Services`, `Crimson Logistics`
   - Document types across management, risk, operations, and emergency preparedness with critical flags
   - Contractor requirement matrix with varied due dates and required counts
   - Sample submissions demonstrating strong (Aurora), mixed (Blue Horizon), and weak (Crimson) compliance
   - Email allow-list support via `allowed_users_email`

4. **Create storage bucket** – in Supabase Storage create a public bucket named `hse-documents`. This bucket stores uploaded HSE evidence files referenced by the app.

5. **Create Auth users** (via Supabase dashboard or CLI):
   - Guest user (`guest@osh.vn`) with the password configured in `VITE_GUEST_PASSWORD`. Do **not** attach a profile record.
   - Admin user (`admin@osh.vn`) – invite/login once then update the `profiles` table to set `role = 'admin'`, `status = 'active'`.
   - Optional contractor users – assign `role = 'contractor'`, link `contractor_id`, and set `status = 'active'` in the `profiles` table.

6. **Verify RLS** by running sample queries as each role (see checklist below).

## Testing & quality checklist

- ✅ **Lint/build** – `npm run build`
- ✅ **Auto guest login** – open the root URL in a new browser session and confirm you land on the dashboard as a guest with read-only data.
- ✅ **Contractor authentication** – login with a contractor account, ensure redirect to *My Submissions*, upload a placeholder submission, and confirm the table refreshes.
- ✅ **File uploads** – confirm the uploaded file appears in Supabase Storage (`hse-documents` bucket) and the download link works from the contractor history and admin approvals screens.
- ✅ **Admin routes** – login as admin and verify access to Approvals Queue, Users & Roles, and Settings. Ensure non-admins are redirected away.
- ✅ **Dashboard analytics** – check KPI cards, critical alerts card, category progress chart, planned vs actual comparator, contractor leaderboard, and the issue snapshot table (including detail drawer + suggested actions).
- ✅ **RLS enforcement** – using Supabase SQL editor:
  - Run `select * from submissions` as a contractor and confirm only their contractor rows return.
  - Attempt to insert/update a submission for another contractor – operation should be rejected.
  - Run `select * from submissions` as a guest account – no rows should be returned because the guest has no linked contractor profile.
- ✅ **Password flows** – request forgot-password email, and as an authenticated user with `force_password_change = true`, verify the forced update experience.

## Role verification guide

| Scenario | Expected behaviour |
| --- | --- |
| **Guest** visits `/` | Auto login via `VITE_GUEST_EMAIL`, dashboard visible, navigation limited to dashboard. Protected routes redirect to `/login`. |
| **Contractor** signs in | Redirect to `/my-submissions`, can create submissions for assigned contractor, can view dashboard. Admin routes blocked. |
| **Admin** signs in | Access to all admin routes plus dashboard. Approvals queue enables approve/reject/revision actions. |

## Deployment notes

- Ensure the guest account credentials are stored in the hosting provider’s environment variables (matching the `VITE_` names).
- Run Supabase migrations in staging/production before deploying updated code.
- When adding new contractors or document types in production, prefer the admin Settings UI which respects RLS and keeps analytics in sync.

## Contributing

- Follow the existing code style (ESLint, Prettier, shadcn conventions).
- Keep migrations idempotent (`create table if not exists`, `insert ... on conflict do nothing`).
- Document assumptions or environment requirements directly in pull requests or this README.
