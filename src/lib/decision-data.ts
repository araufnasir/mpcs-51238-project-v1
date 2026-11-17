import { RATINGS, type Criterion, type DecisionData, type Option, type Scores } from "./types";

const clampRating = (n: unknown) =>
  typeof n === "number" && RATINGS.includes(n as (typeof RATINGS)[number]) ? n : null;

const cleanName = (s: unknown) => (typeof s === "string" ? s.trim().slice(0, 120) : "");

/**
 * Normalise untrusted input (from the browser or an old row) into valid DecisionData:
 * drops malformed items, clamps weights/ratings to 1-5, and removes scores for
 * options or criteria that no longer exist.
 */
export function sanitizeDecisionData(input: unknown): DecisionData {
  const raw = (input ?? {}) as Partial<Record<keyof DecisionData, unknown>>;

  const options: Option[] = (Array.isArray(raw.options) ? raw.options : [])
    .map((o) => ({ id: String(o?.id ?? ""), name: cleanName(o?.name) }))
    .filter((o) => o.id && o.name)
    .slice(0, 20);

  const criteria: Criterion[] = (Array.isArray(raw.criteria) ? raw.criteria : [])
    .map((c) => ({
      id: String(c?.id ?? ""),
      name: cleanName(c?.name),
      weight: clampRating(c?.weight) ?? 3,
      kind: "rating" as const,
    }))
    .filter((c) => c.id && c.name)
    .slice(0, 30);

  const rawScores = (raw.scores ?? {}) as Record<string, Record<string, unknown>>;
  const scores: Scores = {};
  for (const o of options) {
    for (const c of criteria) {
      const s = clampRating(rawScores[o.id]?.[c.id]);
      if (s != null) (scores[o.id] ??= {})[c.id] = s;
    }
  }

  return { options, criteria, scores };
}

/** Starter decision behind the "Try the car example" button. Ratings are left for the user. */
export function carExample(): { title: string; data: DecisionData } {
  const option = (name: string): Option => ({ id: crypto.randomUUID(), name });
  const criterion = (name: string, weight: number): Criterion => ({
    id: crypto.randomUUID(),
    name,
    weight,
    kind: "rating",
  });
  return {
    title: "Buy a car, lease one, or keep taking transit?",
    data: {
      options: [option("Buy"), option("Lease"), option("Transit")],
      criteria: [
        criterion("Monthly cost", 5),
        criterion("Upfront cost", 3),
        criterion("Flexibility", 3),
        criterion("Convenience", 4),
        criterion("Commute time", 4),
      ],
      scores: {},
    },
  };
}
