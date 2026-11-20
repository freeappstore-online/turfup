import { useCallback, useEffect, useState } from "react";
import { initApp } from "@freeappstore/sdk";
import { type NavItem, Shell } from "@freeappstore/sdk/ui";
import { LogScreen } from "./components/LogScreen";
import { SessionsScreen } from "./components/SessionsScreen";
import { StatsScreen } from "./components/StatsScreen";
import type { Draft } from "./components/SessionForm";
import { type Session, loadSessions, newId, saveSessions, sortSessions } from "./lib/sessions";

export const fas = initApp({ appId: "turfup" });

// One entry per screen; `title` becomes the browser tab title.
const NAV: NavItem[] = [
  { label: "Log", href: "/", title: "Turf Up" },
  { label: "Sessions", href: "/sessions", title: "Sessions — Turf Up" },
  { label: "Stats", href: "/stats", title: "Stats — Turf Up" },
];

export default function App() {
  const [path, setPath] = useState(() => window.location.pathname);
  const [sessions, setSessions] = useState<Session[]>(loadSessions);

  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const navigate = useCallback((href: string) => {
    window.history.pushState(null, "", href);
    setPath(window.location.pathname);
  }, []);

  // Every change goes through here: update state and persist. Returns false if the browser refused to store it.
  const commit = useCallback((next: Session[]) => {
    const sorted = sortSessions(next);
    setSessions(sorted);
    return saveSessions(sorted);
  }, []);

  const add = (d: Draft) => commit([{ ...d, id: newId() }, ...sessions]);
  const update = (id: string, d: Draft) => commit(sessions.map((s) => (s.id === id ? { ...d, id } : s)));
  const remove = (id: string) => commit(sessions.filter((s) => s.id !== id));

  return (
    <Shell app={fas} appName="Turf Up" nav={NAV} onNavigate={navigate}>
      <div className="mx-auto w-full max-w-3xl p-4 pb-12 sm:p-8">
        {path === "/sessions" ? (
          <SessionsScreen sessions={sessions} onUpdate={update} onDelete={(id) => void remove(id)} onReplaceAll={commit} />
        ) : path === "/stats" ? (
          <StatsScreen sessions={sessions} onNavigate={navigate} />
        ) : (
          <LogScreen sessions={sessions} onAdd={add} onNavigate={navigate} />
        )}
      </div>
    </Shell>
  );
}
