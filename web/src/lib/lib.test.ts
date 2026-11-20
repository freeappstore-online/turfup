import { describe, expect, it } from "vitest";
import { type Session, formatDuration, isValidDate, mergeSessions, parseSession, parseSessions } from "./sessions";
import { groundStats, monthlyBuckets, thisMonth, totals, weekIndex, weekStreaks } from "./stats";

const mk = (date: string, over: Partial<Session> = {}): Session => ({
  id: `${date}-${Math.random()}`,
  date,
  ground: "Goals Leeds",
  format: 5,
  minutes: 60,
  goals: 2,
  note: "",
  ...over,
});

describe("weeks", () => {
  it("starts weeks on Monday", () => {
    // 2026-11-16 is a Monday, 2026-11-22 the Sunday after it.
    expect(weekIndex("2026-11-16")).toBe(weekIndex("2026-11-22"));
    expect(weekIndex("2026-11-23")).toBe(weekIndex("2026-11-22") + 1);
    expect(weekIndex("2026-11-15")).toBe(weekIndex("2026-11-16") - 1);
  });
});

describe("weekStreaks", () => {
  const today = "2026-11-20"; // Friday
  it("is zero with no sessions", () => {
    expect(weekStreaks([], today)).toEqual({ current: 0, longest: 0, thisWeekDone: false });
  });
  it("counts consecutive weeks including this one", () => {
    const s = [mk("2026-11-19"), mk("2026-11-10"), mk("2026-11-03")];
    expect(weekStreaks(s, today)).toEqual({ current: 3, longest: 3, thisWeekDone: true });
  });
  it("keeps the streak alive until this week is over", () => {
    const s = [mk("2026-11-12"), mk("2026-11-05")];
    expect(weekStreaks(s, today)).toEqual({ current: 2, longest: 2, thisWeekDone: false });
  });
  it("breaks after a missed week but remembers the longest", () => {
    const s = [mk("2026-11-02"), mk("2026-10-26"), mk("2026-10-19"), mk("2026-10-12")];
    expect(weekStreaks(s, today)).toEqual({ current: 0, longest: 4, thisWeekDone: false });
  });
  it("counts several sessions in one week once", () => {
    const s = [mk("2026-11-16"), mk("2026-11-18"), mk("2026-11-20")];
    expect(weekStreaks(s, today).current).toBe(1);
  });
});

describe("monthlyBuckets", () => {
  it("covers 12 months ending now, across a year boundary", () => {
    const b = monthlyBuckets([], 12, "2026-02-10");
    expect(b).toHaveLength(12);
    expect(b[0]!.key).toBe("2025-03");
    expect(b[11]!.key).toBe("2026-02");
  });
  it("sums sessions and goals and ignores older ones", () => {
    const b = monthlyBuckets([mk("2026-11-01", { goals: 3 }), mk("2026-11-15", { goals: 1 }), mk("2020-01-01")], 12, "2026-11-20");
    expect(b[11]).toEqual({ key: "2026-11", sessions: 2, goals: 4 });
    expect(b.reduce((n, x) => n + x.sessions, 0)).toBe(2);
  });
});

describe("groundStats", () => {
  it("merges case variants and ranks by visits", () => {
    const g = groundStats([
      mk("2026-11-01", { ground: "powerleague" }),
      mk("2026-11-08", { ground: "Powerleague " }),
      mk("2026-11-09", { ground: "Goals", goals: 9 }),
    ]);
    expect(g.map((x) => [x.name, x.sessions])).toEqual([["Powerleague", 2], ["Goals", 1]]);
  });
});

describe("totals", () => {
  it("handles empty", () => {
    expect(totals([])).toMatchObject({ sessions: 0, goals: 0, goalsPerSession: 0, best: null });
  });
  it("sums and finds the best session", () => {
    const a = mk("2026-11-01", { goals: 1 });
    const b = mk("2026-11-02", { goals: 4, format: 7 });
    const t = totals([a, b]);
    expect(t).toMatchObject({ sessions: 2, goals: 5, minutes: 120, goalsPerSession: 2.5, five: 1, seven: 1 });
    expect(t.best).toBe(b);
  });
  it("thisMonth only counts the current month", () => {
    expect(thisMonth([mk("2026-11-02"), mk("2026-10-30")], "2026-11-20")).toEqual({ sessions: 1, goals: 2 });
  });
});

describe("validation", () => {
  const good = { id: "a", date: "2026-11-01", ground: "Goals", format: 7, minutes: 90, goals: 0, note: "x" };
  it("accepts a valid session", () => expect(parseSession(good)).toEqual(good));
  it.each([
    ["bad date", { ...good, date: "2026-02-30" }],
    ["bad format", { ...good, format: 11 }],
    ["zero minutes", { ...good, minutes: 0 }],
    ["fractional goals", { ...good, goals: 1.5 }],
    ["negative goals", { ...good, goals: -1 }],
    ["empty ground", { ...good, ground: "  " }],
    ["no id", { ...good, id: "" }],
  ])("rejects %s", (_n, v) => expect(parseSession(v)).toBeNull());
  it("drops junk and duplicate ids from a list", () => {
    expect(parseSessions([good, good, null, 4, { ...good, id: "b", date: "nope" }])).toHaveLength(1);
    expect(parseSessions("nope")).toEqual([]);
  });
  it("isValidDate", () => {
    expect(isValidDate("2024-02-29")).toBe(true);
    expect(isValidDate("2026-02-29")).toBe(false);
  });
  it("merge replaces by id and sorts newest first", () => {
    const a = mk("2026-01-01", { id: "a" });
    const b = mk("2026-02-01", { id: "b" });
    const out = mergeSessions([a], [b, { ...a, goals: 9 }]);
    expect(out.map((s) => s.id)).toEqual(["b", "a"]);
    expect(out[1]!.goals).toBe(9);
  });
  it("formatDuration", () => {
    expect([formatDuration(45), formatDuration(60), formatDuration(90)]).toEqual(["45 min", "1 h", "1 h 30 min"]);
  });
});
