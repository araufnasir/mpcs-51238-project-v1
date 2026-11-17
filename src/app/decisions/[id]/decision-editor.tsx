"use client";

import { useMemo, useState, useTransition } from "react";
import { compare, summarize, topOptionIds, type Summary } from "@/lib/compare";
import { RATINGS, type DecisionData } from "@/lib/types";
import { btn, input } from "@/lib/ui";
import { saveDecision } from "../actions";
import { useUnsavedChangesWarning } from "./use-unsaved-changes-warning";

const timeFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const cell = "border-b border-foreground/10 px-3 py-2 align-middle";
const stickyCol = "sticky left-0 z-10 bg-background";
const bannerTone: Record<Summary["status"], string> = {
  best: "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  close: "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  tie: "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  unrated: "border-foreground/15 bg-foreground/[0.03] text-foreground/80",
  "need-more": "border-foreground/15 bg-foreground/[0.03] text-foreground/80",
};

export function DecisionEditor({
  id,
  initialData,
  initialUpdatedAt,
}: {
  id: string;
  initialData: DecisionData;
  initialUpdatedAt: string;
}) {
  const [data, setData] = useState(initialData);
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initialData));
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const dirty = JSON.stringify(data) !== savedJson;
  useUnsavedChangesWarning(dirty);

  const results = useMemo(() => compare(data), [data]);
  const top = useMemo(() => topOptionIds(results), [results]);
  const summary = useMemo(() => summarize(data, results), [data, results]);
  const canCompare = summary.status !== "need-more";
  const { options, criteria, scores } = data;

  // --- edits -----------------------------------------------------------
  const update = (fn: (d: DecisionData) => DecisionData) => {
    setError(null);
    setData(fn);
  };
  const addOption = (name: string) =>
    update((d) => ({ ...d, options: [...d.options, { id: crypto.randomUUID(), name }] }));
  const addCriterion = (name: string) =>
    update((d) => ({
      ...d,
      criteria: [...d.criteria, { id: crypto.randomUUID(), name, weight: 3, kind: "rating" }],
    }));
  const renameOption = (oid: string, name: string) =>
    update((d) => ({ ...d, options: d.options.map((o) => (o.id === oid ? { ...o, name } : o)) }));
  const editCriterion = (cid: string, patch: { name?: string; weight?: number }) =>
    update((d) => ({
      ...d,
      criteria: d.criteria.map((c) => (c.id === cid ? { ...c, ...patch } : c)),
    }));
  const removeOption = (oid: string) =>
    update((d) => {
      const scores = { ...d.scores };
      delete scores[oid];
      return { ...d, options: d.options.filter((o) => o.id !== oid), scores };
    });
  const removeCriterion = (cid: string) =>
    update((d) => ({
      ...d,
      criteria: d.criteria.filter((c) => c.id !== cid),
      scores: Object.fromEntries(
        Object.entries(d.scores).map(([oid, row]) => {
          const rest = { ...row };
          delete rest[cid];
          return [oid, rest];
        }),
      ),
    }));
  const setScore = (oid: string, cid: string, value: number | null) =>
    update((d) => {
      const row = { ...d.scores[oid] };
      if (value == null) delete row[cid];
      else row[cid] = value;
      return { ...d, scores: { ...d.scores, [oid]: row } };
    });

  const save = () => {
    if ([...options, ...criteria].some((x) => !x.name.trim())) {
      setError("Every option and criterion needs a name before you save.");
      return;
    }
    startSaving(async () => {
      const result = await saveDecision(id, data);
      if (!result.ok) return setError(`Couldn't save: ${result.error}`);
      setSavedJson(JSON.stringify(data));
      setUpdatedAt(result.updatedAt);
    });
  };

  const ready = options.length > 0 && criteria.length > 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <AddForm
          label="Add an option"
          hint="What are you choosing between?"
          placeholder="e.g. Flight A (direct)"
          onAdd={addOption}
        />
        <AddForm
          label="Add a criterion"
          hint="What matters to you in this decision?"
          placeholder="e.g. Price"
          onAdd={addCriterion}
        />
      </div>

      {!ready ? (
        <EmptyState options={options.length} criteria={criteria.length} />
      ) : (
        <>
          <div className="space-y-1" aria-live="polite">
            <p className={`rounded-lg border px-4 py-3 font-medium ${bannerTone[summary.status]}`}>
              {summary.message}
            </p>
            {summary.uneven && (
              <p className="text-xs text-foreground/60">
                Scores only count the criteria you&apos;ve rated.
              </p>
            )}
          </div>
          <p className="text-sm text-foreground/70">
            Rate each option from 1 to 5 on every criterion. <strong>5 = best for me</strong>, so
            for costs, cheaper = higher. Weight says how much a criterion matters (5 = most).
          </p>
          <div className="overflow-x-auto rounded-lg border border-foreground/10">
            <table className="w-full min-w-max border-collapse text-sm">
              <thead>
                <tr className="bg-foreground/[0.03]">
                  <th className={`${cell} ${stickyCol} text-left font-medium`}>Criterion · weight</th>
                  {options.map((o) => (
                    <th key={o.id} className={`${cell} min-w-32 font-medium`}>
                      <div className="flex items-center gap-1">
                        <input
                          value={o.name}
                          onChange={(e) => renameOption(o.id, e.target.value)}
                          aria-label="Option name"
                          className={`${input} px-2 py-1 font-medium`}
                        />
                        <RemoveButton label={`Remove option ${o.name}`} onClick={() => removeOption(o.id)} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {criteria.map((c) => (
                  <tr key={c.id}>
                    <th className={`${cell} ${stickyCol} text-left font-normal`}>
                      <div className="flex items-center gap-1">
                        <input
                          value={c.name}
                          onChange={(e) => editCriterion(c.id, { name: e.target.value })}
                          aria-label="Criterion name"
                          className={`${input} w-32 px-2 py-1 sm:w-44`}
                        />
                        <RatingSelect
                          value={c.weight}
                          onChange={(w) => editCriterion(c.id, { weight: w ?? 3 })}
                          label={`Weight for ${c.name}`}
                          title="Weight (how much this matters)"
                        />
                        <RemoveButton label={`Remove criterion ${c.name}`} onClick={() => removeCriterion(c.id)} />
                      </div>
                    </th>
                    {options.map((o) => (
                      <td key={o.id} className={`${cell} text-center`}>
                        <RatingSelect
                          value={scores[o.id]?.[c.id] ?? null}
                          onChange={(v) => setScore(o.id, c.id, v)}
                          label={`${o.name}: ${c.name}`}
                          allowEmpty
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {canCompare && (
              <tfoot>
                <tr className="bg-foreground/[0.03]">
                  <th className={`${cell} ${stickyCol} text-left font-semibold`}>Weighted score</th>
                  {results.map((r) => (
                    <td
                      key={r.optionId}
                      className={`${cell} text-center ${top.has(r.optionId) ? "bg-emerald-500/15 font-semibold text-emerald-700 dark:text-emerald-300" : ""}`}
                    >
                      <div className="text-lg">{r.percent == null ? "–" : `${r.percent}%`}</div>
                      <div className="text-xs font-normal text-foreground/60">
                        {top.has(r.optionId) ? "Top choice · " : ""}
                        {r.rated}/{r.total} rated
                      </div>
                    </td>
                  ))}
                </tr>
              </tfoot>
              )}
            </table>
          </div>
        </>
      )}

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-foreground/10 bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <button onClick={save} disabled={saving || !dirty} className={btn.primary}>
          {saving ? "Saving…" : "Save"}
        </button>
        <span className="text-sm text-foreground/60" role="status">
          {error ? (
            <span className="text-red-600 dark:text-red-400">{error}</span>
          ) : dirty ? (
            "You have unsaved changes."
          ) : (
            `Saved ${timeFormat.format(new Date(updatedAt))}`
          )}
        </span>
      </div>
    </div>
  );
}

function AddForm({
  label,
  hint,
  placeholder,
  onAdd,
}: {
  label: string;
  hint: string;
  placeholder: string;
  onAdd: (name: string) => void;
}) {
  const [name, setName] = useState("");
  return (
    <form
      className="space-y-2 rounded-lg border border-foreground/10 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;
        onAdd(trimmed);
        setName("");
      }}
    >
      <label className="block">
        <span className="block font-medium">{label}</span>
        <span className="block text-sm text-foreground/60">{hint}</span>
      </label>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={placeholder}
          maxLength={120}
          aria-label={label}
          className={input}
        />
        <button className={`${btn.secondary} shrink-0`}>Add</button>
      </div>
    </form>
  );
}

function RatingSelect({
  value,
  onChange,
  label,
  title,
  allowEmpty = false,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  label: string;
  title?: string;
  allowEmpty?: boolean;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      aria-label={label}
      title={title}
      className="rounded-md border border-foreground/20 bg-background px-2 py-1 text-sm"
    >
      {allowEmpty && <option value="">–</option>}
      {RATINGS.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  );
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={btn.danger}>
      ✕
    </button>
  );
}

function EmptyState({ options, criteria }: { options: number; criteria: number }) {
  const next =
    options === 0 && criteria === 0
      ? "Start by adding the options you're choosing between (at least two), then the criteria that matter to you."
      : options === 0
        ? "Now add the options you're choosing between, at least two."
        : "Now add a criterion: something that matters to you, like cost or time.";
  return (
    <p className="rounded-lg border border-dashed border-foreground/20 p-6 text-center text-foreground/70">
      {next} Your comparison grid will appear here.
    </p>
  );
}
