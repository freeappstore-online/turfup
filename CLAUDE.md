# Turf Up

A log for casual football: record each turf session (ground, 5- or 7-a-side, duration, goals, note) and see sessions per month, favourite grounds, goals and week streaks.

- Subdomain: `turfup.freeappstore.online`
- Dev:    `pnpm install && pnpm dev`
- Check:  `pnpm typecheck && pnpm test && fas check`
- Build:  `pnpm build`
- Deploy: `git push origin main` (auto-deploys to R2 via GitHub Actions)

Free, MIT-licensed, no tracking. For platform conventions, read
https://raw.githubusercontent.com/freeappstore-online/freeappstore/main/SKILLS.md
before writing or changing anything.

## Repo-specific notes

- Standalone app: no sign-in, no backend. All data is in localStorage under `turfup:v1:sessions`.
- `web/src/lib/sessions.ts` is the data model, validation (`parseSession`) and storage. Anything read from storage or an imported file goes through it.
- `web/src/lib/stats.ts` is pure statistics (months, grounds, streaks). Weeks are Monday-based, and the streak counts weeks with at least one session; it stays alive through the current week if last week was played. Covered by `web/src/lib/lib.test.ts`.
- Dates are local `YYYY-MM-DD` strings, never `Date.toISOString()` (that shifts the day near midnight).
- `web/src/App.tsx` owns the sessions state and routes (`/`, `/sessions`, `/stats`); `Shell` provides the topbar and `/profile`.
