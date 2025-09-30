# Authentication and Authorization Flow

## Session & profile resolution
- `useSessionRole` waits for Supabase auth to finish bootstrapping before any redirect happens.
- When an authenticated user has no `profiles` row, the hook upserts a default record and applies the Supabase metadata role (admin -> active, otherwise invited) before continuing.
- Roles resolve to `guest` until the profile is active, preventing premature contractor/admin access while data is loading or inactive.

## Route guard behaviour
- `withRole` only renders protected pages once `useSessionRole` reports `loading = false`; otherwise it shows a spinner.
- When access is denied, routing falls back by role: contractor -> `/my-submissions`, guest -> `/`, admin -> `/dashboard`. Passing a custom `redirectTo` still works (eg. forcing `/login`).
- The guard now appends `?returnTo=...` automatically when it redirects to `/login`, allowing us to round-trip the original URL.
- `AppShell` enforces extra rules per section: guests that hit `/admin/*` are sent back to `/`, guest visits to `/my-submissions` go to the login page with `returnTo`, and contractors attempting `/admin/*` are pushed to `/my-submissions`.

## Auto-guest scope
- `ensureSession` only auto-signs the shared guest account when there is no active session **and** the browser is currently on `/`.
- Admin, contractor, login, forgot-password, and contractor areas explicitly block the guest auto-login so real sessions are never replaced.

## Login return-to handling
- `LoginPage` honours both `location.state.from` (from the guard) and a `?returnTo=/...` query parameter.
- Unsafe or cross-role destinations are ignored; admins fall back to `/dashboard`, contractors fall back to `/my-submissions`.
- Successful logins replace history with the resolved target so the `returnTo` parameter disappears after redirect.


