import { useMemo } from "react";
import { Card, EmptyState, PageHeader, ProgressBar } from "@freeappstore/sdk/ui";
import { type Session, formatDate, formatDuration, monthLabel } from "../lib/sessions";
import { groundStats, monthlyBuckets, thisMonth, totals, weekStreaks } from "../lib/stats";
import { Stat, btnPrimary } from "./bits";

interface Props {
  sessions: Session[];
  onNavigate: (href: string) => void;
}

export function StatsScreen({ sessions, onNavigate }: Props) {
  const t = useMemo(() => totals(sessions), [sessions]);
  const month = useMemo(() => thisMonth(sessions), [sessions]);
  const streak = useMemo(() => weekStreaks(sessions), [sessions]);
  const buckets = useMemo(() => monthlyBuckets(sessions, 12), [sessions]);
  const grounds = useMemo(() => groundStats(sessions), [sessions]);

  if (sessions.length === 0) {
    return (
      <>
        <PageHeader title="Stats" />
        <EmptyState
          title="No stats yet"
          message="Log a session and your months, grounds, goals and streaks appear here."
          action={
            <a
              href="/"
              className={btnPrimary}
              onClick={(e) => {
                e.preventDefault();
                onNavigate("/");
              }}
            >
              Log a session
            </a>
          }
        />
      </>
    );
  }

  const peak = Math.max(1, ...buckets.map((b) => b.sessions));
  const topGrounds = grounds.slice(0, 5);
  const topVisits = topGrounds[0]?.sessions ?? 1;
  const chartSummary = buckets.map((b) => `${monthLabel(b.key)}: ${b.sessions}`).join(", ");

  return (
    <>
      <PageHeader title="Stats" description={`${t.sessions} sessions, ${formatDuration(t.minutes)} on the turf.`} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="This month" value={month.sessions} hint={month.sessions === 1 ? "session" : "sessions"} />
        <Stat label="Goals" value={t.goals} hint={`${t.goalsPerSession.toFixed(1)} per session`} />
        <Stat label="Week streak" value={streak.current} hint={streak.current === 0 ? "play this week to start" : streak.thisWeekDone ? "this week done" : "play this week to keep it"} />
        <Stat label="Best streak" value={streak.longest} hint={streak.longest === 1 ? "week" : "weeks"} />
      </div>

      <section aria-labelledby="months-h" className="mt-8">
        <h2 id="months-h" className="mb-3 text-xl font-bold">
          Sessions per month
        </h2>
        <Card padding="1rem">
          <div role="img" aria-label={`Sessions per month, last 12 months. ${chartSummary}`} className="flex h-40 items-end gap-1 sm:gap-2">
            {buckets.map((b) => (
              <div key={b.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end" aria-hidden="true">
                <span className="mb-1 text-xs font-semibold text-ink">{b.sessions || ""}</span>
                <div
                  className={b.sessions ? "w-full rounded-t bg-accent" : "w-full rounded-t bg-line"}
                  style={{ height: b.sessions ? `${Math.max(6, (b.sessions / peak) * 100)}%` : "2px" }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-1 sm:gap-2" aria-hidden="true">
            {buckets.map((b) => (
              <span key={b.key} className="min-w-0 flex-1 text-center text-[0.65rem] text-muted sm:text-xs">
                {monthLabel(b.key).slice(0, 3)}
              </span>
            ))}
          </div>
        </Card>
      </section>

      <section aria-labelledby="grounds-h" className="mt-8">
        <h2 id="grounds-h" className="mb-3 text-xl font-bold">
          Favourite grounds
        </h2>
        <ol className="grid gap-3">
          {topGrounds.map((g, i) => (
            <li key={g.name.toLowerCase()} className="rounded-[var(--radius)] border border-line bg-panel p-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate font-semibold">
                  <span className="mr-2 text-muted">{i + 1}.</span>
                  {g.name}
                </span>
                <span className="shrink-0 text-sm text-muted">
                  {g.sessions} {g.sessions === 1 ? "visit" : "visits"} · {g.goals} {g.goals === 1 ? "goal" : "goals"}
                </span>
              </div>
              <div className="mt-2">
                <ProgressBar value={g.sessions} max={topVisits} height={6} />
              </div>
              <div className="mt-1 text-xs text-muted">Last played {formatDate(g.lastDate)}</div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="mix-h" className="mt-8">
        <h2 id="mix-h" className="mb-3 text-xl font-bold">
          Format and highlights
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card padding="1rem">
            <div className="text-sm font-semibold text-muted">5-a-side vs 7-a-side</div>
            <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-line" role="img" aria-label={`${t.five} five-a-side, ${t.seven} seven-a-side`}>
              <div className="bg-accent" style={{ width: `${(t.five / t.sessions) * 100}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span>
                <strong>{t.five}</strong> five-a-side
              </span>
              <span>
                <strong>{t.seven}</strong> seven-a-side
              </span>
            </div>
          </Card>
          <Card padding="1rem">
            <div className="text-sm font-semibold text-muted">Best session</div>
            {t.best ? (
              <p className="mt-2">
                <strong>
                  {t.best.goals} {t.best.goals === 1 ? "goal" : "goals"}
                </strong>{" "}
                at {t.best.ground}
                <span className="block text-sm text-muted">{formatDate(t.best.date)}</span>
              </p>
            ) : (
              <p className="mt-2 text-muted">No goals logged yet. Go and get one.</p>
            )}
          </Card>
        </div>
      </section>
    </>
  );
}
