import { useEffect, useMemo, useRef, useState } from "react";
import { Card, EmptyState, PageHeader, useToast } from "@freeappstore/sdk/ui";
import { type Session, toDateStr } from "../lib/sessions";
import { groundStats, weekStreaks } from "../lib/stats";
import { pwa } from "../pwa";
import { SessionForm, type Draft } from "./SessionForm";
import { SessionRow } from "./bits";

interface Props {
  sessions: Session[];
  onAdd: (draft: Draft) => boolean;
  onNavigate: (href: string) => void;
}

export function LogScreen({ sessions, onAdd, onNavigate }: Props) {
  const toast = useToast();
  const [formKey, setFormKey] = useState(0);
  const dirty = useRef(false);

  // Hold back an app update while a half-filled session is on screen.
  useEffect(() => pwa.addBusyGuard(() => dirty.current), []);

  const last = sessions[0];
  const initial: Draft = useMemo(
    () => ({ date: toDateStr(), ground: last?.ground ?? "", format: last?.format ?? 5, minutes: last?.minutes ?? 60, goals: 0, note: "" }),
    // Recompute defaults only when a session is added, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formKey, sessions.length],
  );
  const grounds = useMemo(() => groundStats(sessions).map((g) => g.name), [sessions]);
  const streak = weekStreaks(sessions);

  const submit = (draft: Draft) => {
    const ok = onAdd(draft);
    dirty.current = false;
    setFormKey((k) => k + 1);
    if (ok) {
      toast.show(draft.goals > 0 ? `Logged. ${draft.goals} ${draft.goals === 1 ? "goal" : "goals"} at ${draft.ground}.` : `Logged your session at ${draft.ground}.`, { variant: "success" });
    } else {
      toast.show("Saved for now, but this browser would not store it. Export a backup from Sessions.", { variant: "error" });
    }
  };

  return (
    <>
      <PageHeader
        title="Log a session"
        description={
          streak.current > 0
            ? `${streak.current} ${streak.current === 1 ? "week" : "weeks"} in a row. ${streak.thisWeekDone ? "Keep it going." : "Play this week to keep it alive."}`
            : "Ground, format, how long, how many goals."
        }
      />
      <Card padding="1rem">
        <SessionForm key={formKey} initial={initial} grounds={grounds} submitLabel="Save session" onSubmit={submit} onDirtyChange={(d) => (dirty.current = d)} />
      </Card>

      <section aria-labelledby="recent-h" className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="recent-h" className="text-xl font-bold">
            Latest
          </h2>
          {sessions.length > 3 ? (
            <a
              href="/sessions"
              className="text-sm font-semibold text-accent underline"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("/sessions");
              }}
            >
              All {sessions.length} sessions
            </a>
          ) : null}
        </div>
        {sessions.length === 0 ? (
          <EmptyState title="No sessions yet" message="Log your first game above and your stats start building." />
        ) : (
          <ul className="grid gap-3">
            {sessions.slice(0, 3).map((s) => (
              <SessionRow key={s.id} s={s} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
