import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { ConfirmDialog, EmptyState, Modal, PageHeader, SearchInput, useToast } from "@freeappstore/sdk/ui";
import { type Session, mergeSessions, monthKey, monthLabel, parseSessions } from "../lib/sessions";
import { groundStats } from "../lib/stats";
import { SessionForm, type Draft } from "./SessionForm";
import { SessionRow, btnGhost } from "./bits";

interface Props {
  sessions: Session[];
  onUpdate: (id: string, draft: Draft) => boolean;
  onDelete: (id: string) => void;
  onReplaceAll: (list: Session[]) => boolean;
}

export function SessionsScreen({ sessions, onUpdate, onDelete, onReplaceAll }: Props) {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Session | null>(null);
  const [deleting, setDeleting] = useState<Session | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const grounds = useMemo(() => groundStats(sessions).map((g) => g.name), [sessions]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const shown = q ? sessions.filter((s) => s.ground.toLowerCase().includes(q) || s.note.toLowerCase().includes(q)) : sessions;
    const map = new Map<string, Session[]>();
    for (const s of shown) {
      const k = monthKey(s.date);
      map.set(k, [...(map.get(k) ?? []), s]);
    }
    return [...map.entries()];
  }, [sessions, query]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ app: "turfup", version: 1, sessions }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `turf-up-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.show("Backup downloaded", { variant: "success" });
  };

  const importJson = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw new Error("too big");
      const data: unknown = JSON.parse(await file.text());
      const list = parseSessions(Array.isArray(data) ? data : (data as { sessions?: unknown })?.sessions);
      if (list.length === 0) throw new Error("none");
      const merged = mergeSessions(sessions, list);
      const added = merged.length - sessions.length;
      onReplaceAll(merged);
      toast.show(`Imported ${list.length} ${list.length === 1 ? "session" : "sessions"} (${added} new)`, { variant: "success" });
    } catch {
      toast.show("That file has no Turf Up sessions in it.", { variant: "error" });
    }
  };

  return (
    <>
      <PageHeader title="Sessions" description={`${sessions.length} logged on this device.`} />

      {sessions.length === 0 ? (
        <EmptyState title="Nothing here yet" message="Sessions you log show up here, newest first." />
      ) : (
        <>
          <SearchInput value={query} onChange={setQuery} placeholder="Search ground or note" />
          {groups.length === 0 ? (
            <p className="mt-6 text-center text-muted">No sessions match “{query}”.</p>
          ) : (
            groups.map(([key, list]) => (
              <section key={key} aria-labelledby={`m-${key}`} className="mt-6">
                <h2 id={`m-${key}`} className="mb-2 text-lg font-bold">
                  {monthLabel(key, true)} <span className="text-sm font-normal text-muted">· {list.length}</span>
                </h2>
                <ul className="grid gap-3">
                  {list.map((s) => (
                    <SessionRow
                      key={s.id}
                      s={s}
                      actions={
                        <>
                          <button type="button" className={`${btnGhost} min-h-11 text-sm`} onClick={() => setEditing(s)} aria-label={`Edit session at ${s.ground}`}>
                            Edit
                          </button>
                          <button type="button" className={`${btnGhost} min-h-11 text-sm text-danger`} onClick={() => setDeleting(s)} aria-label={`Delete session at ${s.ground}`}>
                            Delete
                          </button>
                        </>
                      }
                    />
                  ))}
                </ul>
              </section>
            ))
          )}
        </>
      )}

      <section aria-labelledby="backup-h" className="mt-10 rounded-[var(--radius)] border border-line p-4">
        <h2 id="backup-h" className="text-lg font-bold">
          Backup
        </h2>
        <p className="mt-1 text-sm text-muted">Sessions live in this browser only. Export a file to keep them safe or move them to another device.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={btnGhost} onClick={exportJson} disabled={sessions.length === 0}>
            Export JSON
          </button>
          <button type="button" className={btnGhost} onClick={() => fileRef.current?.click()}>
            Import JSON
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={importJson} />
        </div>
      </section>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Edit session">
        {editing ? (
          <SessionForm
            initial={editing}
            grounds={grounds}
            submitLabel="Save changes"
            onCancel={() => setEditing(null)}
            onSubmit={(draft) => {
              const ok = onUpdate(editing.id, draft);
              setEditing(null);
              toast.show(ok ? "Session updated" : "Updated, but this browser would not store it.", { variant: ok ? "success" : "error" });
            }}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this session?"
        message={deleting ? `${deleting.ground}, ${deleting.date}. This cannot be undone.` : ""}
        confirmLabel="Delete"
        variant="danger"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) onDelete(deleting.id);
          setDeleting(null);
          toast.show("Session deleted", { variant: "success" });
        }}
      />
    </>
  );
}
