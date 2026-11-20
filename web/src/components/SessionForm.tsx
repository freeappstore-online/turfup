import { useId, useState, type FormEvent } from "react";
import { type Format, LIMITS, type Session, isValidDate, toDateStr } from "../lib/sessions";
import { btnGhost, btnPrimary, inputCls } from "./bits";

export type Draft = Omit<Session, "id">;

interface Props {
  /** Values to start from (a session being edited, or the last-used ground/format/length). */
  initial: Draft;
  grounds: string[];
  submitLabel: string;
  onSubmit: (draft: Draft) => void;
  onCancel?: () => void;
  /** Called whenever the form differs from `initial` (true) or matches it again (false). */
  onDirtyChange?: (dirty: boolean) => void;
}

const DURATIONS = [45, 60, 90];

export function SessionForm({ initial, grounds, submitLabel, onSubmit, onCancel, onDirtyChange }: Props) {
  const uid = useId();
  const [date, setDate] = useState(initial.date);
  const [ground, setGround] = useState(initial.ground);
  const [format, setFormat] = useState<Format>(initial.format);
  const [minutes, setMinutes] = useState(String(initial.minutes));
  const [goals, setGoals] = useState(String(initial.goals));
  const [note, setNote] = useState(initial.note);
  const [errors, setErrors] = useState<Partial<Record<"date" | "ground" | "minutes" | "goals", string>>>({});

  const clear = (k: "date" | "ground" | "minutes" | "goals") => setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e));
  const report = (next: { date?: string; ground?: string; format?: Format; minutes?: string; goals?: string; note?: string }) => {
    if (!onDirtyChange) return;
    const d = next.date ?? date;
    const g = next.ground ?? ground;
    const f = next.format ?? format;
    const m = next.minutes ?? minutes;
    const go = next.goals ?? goals;
    const n = next.note ?? note;
    onDirtyChange(
      d !== initial.date || g !== initial.ground || f !== initial.format || m !== String(initial.minutes) || go !== String(initial.goals) || n !== initial.note,
    );
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    const name = ground.trim();
    const min = Number(minutes);
    const g = Number(goals);
    if (!isValidDate(date) || date > toDateStr()) errs.date = "Pick a date that is today or earlier.";
    if (!name) errs.ground = "Enter where you played.";
    if (!Number.isInteger(min) || min < 1 || min > LIMITS.minutes) errs.minutes = `Enter 1 to ${LIMITS.minutes} minutes.`;
    if (!Number.isInteger(g) || g < 0 || g > LIMITS.goals) errs.goals = `Enter 0 to ${LIMITS.goals} goals.`;
    setErrors(errs);
    if (Object.keys(errs).length) {
      // Move focus to the first problem so keyboard users land on it.
      const first = (["date", "ground", "minutes", "goals"] as const).find((k) => errs[k]);
      if (first) document.getElementById(`${uid}-${first}`)?.focus();
      return;
    }
    onSubmit({ date, ground: name.slice(0, LIMITS.ground), format, minutes: min, goals: g, note: note.trim().slice(0, LIMITS.note) });
  };

  const bumpGoals = (by: number) => {
    const next = String(Math.min(LIMITS.goals, Math.max(0, (Number.isInteger(Number(goals)) ? Number(goals) : 0) + by)));
    setGoals(next);
    report({ goals: next });
  };

  const err = (k: keyof typeof errors) =>
    errors[k] ? (
      <p id={`${uid}-${k}-err`} role="alert" className="mt-1 text-sm text-danger">
        {errors[k]}
      </p>
    ) : null;
  const aria = (k: keyof typeof errors) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? `${uid}-${k}-err` : undefined });
  const label = "mb-1 block text-sm font-semibold text-ink";

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-date`} className={label}>
            Date
          </label>
          <input
            id={`${uid}-date`}
            type="date"
            className={inputCls}
            value={date}
            max={toDateStr()}
            onChange={(e) => {
              setDate(e.target.value);
              clear("date");
              report({ date: e.target.value });
            }}
            {...aria("date")}
          />
          {err("date")}
        </div>
        <div>
          <label htmlFor={`${uid}-ground`} className={label}>
            Ground
          </label>
          <input
            id={`${uid}-ground`}
            className={inputCls}
            value={ground}
            maxLength={LIMITS.ground}
            list={`${uid}-grounds`}
            autoComplete="off"
            placeholder="e.g. Powerleague, the rec"
            onChange={(e) => {
              setGround(e.target.value);
              clear("ground");
              report({ ground: e.target.value });
            }}
            {...aria("ground")}
          />
          <datalist id={`${uid}-grounds`}>
            {grounds.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
          {err("ground")}
        </div>
      </div>

      <fieldset>
        <legend className={label}>Format</legend>
        <div className="grid grid-cols-2 gap-2">
          {([5, 7] as const).map((f) => (
            <label
              key={f}
              className="flex min-h-11 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border border-line-strong bg-paper px-3 font-semibold text-ink has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-paper has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent"
            >
              <input
                type="radio"
                name={`${uid}-format`}
                className="sr-only"
                checked={format === f}
                onChange={() => {
                  setFormat(f);
                  report({ format: f });
                }}
              />
              {f}-a-side
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-minutes`} className={label}>
            Duration (minutes)
          </label>
          <input
            id={`${uid}-minutes`}
            type="number"
            inputMode="numeric"
            min={1}
            max={LIMITS.minutes}
            step={1}
            className={inputCls}
            value={minutes}
            onChange={(e) => {
              setMinutes(e.target.value);
              clear("minutes");
              report({ minutes: e.target.value });
            }}
            {...aria("minutes")}
          />
          <div className="mt-2 flex gap-2" role="group" aria-label="Common durations">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                className="min-h-11 flex-1 rounded-[var(--radius-sm)] border border-line bg-panel text-sm font-semibold text-ink hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-accent"
                onClick={() => {
                  setMinutes(String(d));
                  report({ minutes: String(d) });
                }}
              >
                {d}
              </button>
            ))}
          </div>
          {err("minutes")}
        </div>
        <div>
          <label htmlFor={`${uid}-goals`} className={label}>
            Goals scored
          </label>
          <div className="flex gap-2">
            <button type="button" className={`${btnGhost} w-12 shrink-0 px-0 text-xl`} aria-label="One fewer goal" onClick={() => bumpGoals(-1)}>
              −
            </button>
            <input
              id={`${uid}-goals`}
              type="number"
              inputMode="numeric"
              min={0}
              max={LIMITS.goals}
              step={1}
              className={`${inputCls} text-center`}
              value={goals}
              onChange={(e) => {
                setGoals(e.target.value);
                clear("goals");
                report({ goals: e.target.value });
              }}
              {...aria("goals")}
            />
            <button type="button" className={`${btnGhost} w-12 shrink-0 px-0 text-xl`} aria-label="One more goal" onClick={() => bumpGoals(1)}>
              +
            </button>
          </div>
          {err("goals")}
        </div>
      </div>

      <div>
        <label htmlFor={`${uid}-note`} className={label}>
          Note <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id={`${uid}-note`}
          className={`${inputCls} min-h-24 py-2`}
          rows={3}
          maxLength={LIMITS.note}
          placeholder="Who was there, how it went, that screamer…"
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            report({ note: e.target.value });
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className={btnPrimary}>
          {submitLabel}
        </button>
        {onCancel ? (
          <button type="button" className={btnGhost} onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
