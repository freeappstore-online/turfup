// Pure statistics over a list of sessions. No DOM, no storage.

import { type Session, monthKey, toDateStr } from "./sessions";

/** Days since 1970-01-01 for a YYYY-MM-DD date, calendar-only (no timezone drift). */
function dayNumber(date: string): number {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Monday-based week index. 1970-01-01 was a Thursday, hence the +3. */
export function weekIndex(date: string): number {
  return Math.floor((dayNumber(date) + 3) / 7);
}

export interface Streaks {
  /** Consecutive weeks, ending this week or last week, with at least one session. */
  current: number;
  longest: number;
  /** True when this week has a session already; false means the streak is waiting on one. */
  thisWeekDone: boolean;
}

export function weekStreaks(sessions: Session[], today: string = toDateStr()): Streaks {
  const weeks = [...new Set(sessions.map((s) => weekIndex(s.date)))].sort((a, b) => a - b);
  let longest = 0;
  let run = 0;
  let prev = Number.NaN;
  for (const w of weeks) {
    run = w === prev + 1 ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = w;
  }
  const set = new Set(weeks);
  const thisWeek = weekIndex(today);
  const thisWeekDone = set.has(thisWeek);
  // A streak survives until the week is over, so start from last week if this one is empty.
  let cursor = thisWeekDone ? thisWeek : thisWeek - 1;
  let current = 0;
  while (set.has(cursor)) {
    current++;
    cursor--;
  }
  return { current, longest, thisWeekDone };
}

export interface MonthBucket {
  key: string;
  sessions: number;
  goals: number;
}

/** The last `count` calendar months ending with the month of `today`, oldest first. */
export function monthlyBuckets(sessions: Session[], count = 12, today: string = toDateStr()): MonthBucket[] {
  const [ty, tm] = today.split("-").map(Number) as [number, number];
  const buckets: MonthBucket[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const idx = ty * 12 + (tm - 1) - i;
    const y = Math.floor(idx / 12);
    const m = (idx % 12) + 1;
    buckets.push({ key: `${y}-${String(m).padStart(2, "0")}`, sessions: 0, goals: 0 });
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const s of sessions) {
    const b = byKey.get(monthKey(s.date));
    if (b) {
      b.sessions++;
      b.goals += s.goals;
    }
  }
  return buckets;
}

export interface GroundStat {
  name: string;
  sessions: number;
  goals: number;
  minutes: number;
  lastDate: string;
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** Grounds ranked by visits (then goals, then most recent). Spelling variants by case merge. */
export function groundStats(sessions: Session[]): GroundStat[] {
  const map = new Map<string, GroundStat>();
  for (const s of sessions) {
    const k = norm(s.ground);
    const g = map.get(k);
    if (!g) {
      map.set(k, { name: s.ground.trim(), sessions: 1, goals: s.goals, minutes: s.minutes, lastDate: s.date });
      continue;
    }
    g.sessions++;
    g.goals += s.goals;
    g.minutes += s.minutes;
    if (s.date > g.lastDate) {
      g.lastDate = s.date;
      g.name = s.ground.trim(); // show the spelling used most recently
    }
  }
  return [...map.values()].sort(
    (a, b) => b.sessions - a.sessions || b.goals - a.goals || (a.lastDate < b.lastDate ? 1 : -1) || a.name.localeCompare(b.name),
  );
}

export interface Totals {
  sessions: number;
  goals: number;
  minutes: number;
  goalsPerSession: number;
  five: number;
  seven: number;
  best: Session | null;
}

export function totals(sessions: Session[]): Totals {
  let goals = 0;
  let minutes = 0;
  let five = 0;
  let best: Session | null = null;
  for (const s of sessions) {
    goals += s.goals;
    minutes += s.minutes;
    if (s.format === 5) five++;
    if (!best || s.goals > best.goals || (s.goals === best.goals && s.date > best.date)) best = s;
  }
  return {
    sessions: sessions.length,
    goals,
    minutes,
    goalsPerSession: sessions.length ? goals / sessions.length : 0,
    five,
    seven: sessions.length - five,
    best: best && best.goals > 0 ? best : null,
  };
}

export function thisMonth(sessions: Session[], today: string = toDateStr()): { sessions: number; goals: number } {
  const key = monthKey(today);
  let n = 0;
  let goals = 0;
  for (const s of sessions) {
    if (monthKey(s.date) === key) {
      n++;
      goals += s.goals;
    }
  }
  return { sessions: n, goals };
}
