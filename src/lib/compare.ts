import type { DecisionData, Scores } from "./types";

/** Reads a rating via own properties only, so keys like "__proto__" can't reach the prototype. */
export function getScore(scores: Scores, optionId: string, criterionId: string): number | undefined {
  if (!Object.hasOwn(scores, optionId)) return undefined;
  const row = scores[optionId];
  return Object.hasOwn(row, criterionId) ? row[criterionId] : undefined;
}

export type OptionResult = {
  optionId: string;
  /** 0-100, or null if the option has no ratings yet. */
  percent: number | null;
  rated: number; // criteria rated for this option
  total: number; // criteria in the decision
};

/**
 * Weighted score per option: sum(weight x score) / sum(weight x 5), as a percentage.
 * Only rated cells count, so an unrated cell neither helps nor hurts an option;
 * `rated`/`total` lets the UI show how complete each column is.
 */
export function compare({ options, criteria, scores }: DecisionData): OptionResult[] {
  return options.map((option) => {
    let earned = 0;
    let possible = 0;
    let rated = 0;
    for (const c of criteria) {
      const score = getScore(scores, option.id, c.id);
      if (score == null) continue;
      earned += c.weight * score;
      possible += c.weight * 5;
      rated++;
    }
    return {
      optionId: option.id,
      percent: possible > 0 ? Math.round((earned / possible) * 100) : null,
      rated,
      total: criteria.length,
    };
  });
}

/** Ids of the highest-scoring option(s); ties are all included. */
export function topOptionIds(results: OptionResult[]): Set<string> {
  const best = Math.max(...results.map((r) => r.percent ?? -1));
  return new Set(
    best < 0 ? [] : results.filter((r) => r.percent === best).map((r) => r.optionId),
  );
}

export const MIN_OPTIONS = 2;
export const MIN_CRITERIA = 1;
export const CLOSE_CALL_POINTS = 5;

export type Summary = {
  status: "need-more" | "unrated" | "tie" | "close" | "best";
  message: string;
  /** Options have different numbers of rated criteria. */
  uneven: boolean;
};

/** Plain-language result for the banner above the grid. */
export function summarize(data: DecisionData, results = compare(data)): Summary {
  if (data.options.length < MIN_OPTIONS || data.criteria.length < MIN_CRITERIA) {
    return {
      status: "need-more",
      message: "Add at least two options and one criterion to compare.",
      uneven: false,
    };
  }

  const name = (id: string) => data.options.find((o) => o.id === id)?.name ?? "";
  const uneven = new Set(results.map((r) => r.rated)).size > 1;
  const top = topOptionIds(results);

  if (top.size === 0) {
    return { status: "unrated", message: "Rate the options below to see your best match.", uneven };
  }
  if (top.size > 1) {
    return { status: "tie", message: `Tie: ${[...top].map(name).join(", ")}`, uneven };
  }

  const ranked = results
    .filter((r) => r.percent != null)
    .sort((a, b) => b.percent! - a.percent!);
  const [first, second] = ranked;
  if (second && first.percent! - second.percent! <= CLOSE_CALL_POINTS) {
    return {
      status: "close",
      message: `Too close to call: ${name(first.optionId)} and ${name(second.optionId)}. Adjust your weights or add another criterion.`,
      uneven,
    };
  }
  return {
    status: "best",
    message: `Best match: ${name(first.optionId)} (${first.percent}%)`,
    uneven,
  };
}
