import type { ReactNode } from "react";
import { Badge } from "@freeappstore/sdk/ui";
import { type Session, formatDate, formatDuration, formatLabel } from "../lib/sessions";

export const inputCls =
  "min-h-11 w-full rounded-[var(--radius-sm)] border border-line-strong bg-paper px-3 text-base text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent";

export const btnPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-accent px-5 font-semibold text-paper hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50";

export const btnGhost =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-line-strong bg-paper px-4 font-semibold text-ink hover:bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-line bg-panel p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold leading-none text-ink">{value}</div>
      {hint ? <div className="mt-1.5 text-xs text-muted">{hint}</div> : null}
    </div>
  );
}

export function SessionRow({ s, actions }: { s: Session; actions?: ReactNode }) {
  return (
    <li className="rounded-[var(--radius)] border border-line bg-panel p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-semibold text-ink">{s.ground}</div>
          <div className="text-sm text-muted">{formatDate(s.date)}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-[family-name:var(--font-display)] text-2xl font-bold leading-none text-ink">
            {s.goals}
            <span className="sr-only"> goals</span>
          </div>
          <div className="text-xs text-muted" aria-hidden="true">
            {s.goals === 1 ? "goal" : "goals"}
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge variant="accent">{formatLabel(s.format)}</Badge>
        <Badge>{formatDuration(s.minutes)}</Badge>
      </div>
      {s.note ? <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{s.note}</p> : null}
      {actions ? <div className="mt-3 flex gap-2">{actions}</div> : null}
    </li>
  );
}
