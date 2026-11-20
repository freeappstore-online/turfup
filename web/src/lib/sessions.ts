// The data model and device-local storage for logged turf sessions.

export type Format = 5 | 7;

export interface Session {
  id: string;
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  ground: string;
  format: Format;
  minutes: number;
  goals: number;
  note: string;
}

export const STORAGE_KEY = "turfup:v1:sessions";

export const LIMITS = { minutes: 300, goals: 99, ground: 80, note: 500 } as const;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Today (or `d`) as a local YYYY-MM-DD string. */
export function toDateStr(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function isValidDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Validate one unknown value as a Session, or return null. Never trust stored or imported data. */
export function parseSession(raw: unknown): Session | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const ground = typeof r.ground === "string" ? r.ground.trim().slice(0, LIMITS.ground) : "";
  const format = r.format === 5 || r.format === 7 ? r.format : null;
  const minutes = r.minutes;
  const goals = r.goals;
  if (typeof r.id !== "string" || !r.id) return null;
  if (typeof r.date !== "string" || !isValidDate(r.date)) return null;
  if (!ground || format === null) return null;
  if (typeof minutes !== "number" || !Number.isInteger(minutes) || minutes < 1 || minutes > LIMITS.minutes) return null;
  if (typeof goals !== "number" || !Number.isInteger(goals) || goals < 0 || goals > LIMITS.goals) return null;
  const note = typeof r.note === "string" ? r.note.slice(0, LIMITS.note) : "";
  return { id: r.id, date: r.date, ground, format, minutes, goals, note };
}

export function parseSessions(raw: unknown): Session[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: Session[] = [];
  for (const item of raw) {
    const s = parseSession(item);
    if (s && !seen.has(s.id)) {
      seen.add(s.id);
      out.push(s);
    }
  }
  return sortSessions(out);
}

/** Newest first; ties keep a stable order by id. */
export function sortSessions(list: Session[]): Session[] {
  return [...list].sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : a.date < b.date ? 1 : -1));
}

export function loadSessions(): Session[] {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    return text ? parseSessions(JSON.parse(text)) : [];
  } catch {
    return [];
  }
}

/** Returns false when the browser refused the write (private mode, quota). */
export function saveSessions(list: Session[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

/** Merge imported sessions into existing ones; an imported id replaces the same id. */
export function mergeSessions(existing: Session[], incoming: Session[]): Session[] {
  const byId = new Map(existing.map((s) => [s.id, s]));
  for (const s of incoming) byId.set(s.id, s);
  return sortSessions([...byId.values()]);
}

export function formatLabel(f: Format): string {
  return `${f}-a-side`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export function monthKey(date: string): string {
  return date.slice(0, 7);
}

export function monthLabel(key: string, long = false): string {
  const [y, m] = key.split("-").map(Number) as [number, number];
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, long ? { month: "long", year: "numeric" } : { month: "short" });
}
