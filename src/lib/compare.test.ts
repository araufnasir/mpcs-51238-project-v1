import { test } from "node:test";
import assert from "node:assert/strict";
import { compare, summarize, topOptionIds } from "./compare.ts";
import type { DecisionData } from "./types.ts";

const base: DecisionData = {
  options: [
    { id: "a", name: "A" },
    { id: "b", name: "B" },
  ],
  criteria: [
    { id: "cost", name: "Cost", weight: 5, kind: "rating" },
    { id: "fun", name: "Fun", weight: 1, kind: "rating" },
  ],
  scores: {},
};

test("weighted percentage = sum(w*s) / sum(w*5)", () => {
  const [a, b] = compare({ ...base, scores: { a: { cost: 4, fun: 1 }, b: { cost: 2, fun: 5 } } });
  assert.equal(a.percent, 70); // (20 + 1) / 30
  assert.equal(b.percent, 50); // (10 + 5) / 30
  assert.deepEqual([a.rated, a.total], [2, 2]);
});

test("unrated cells are skipped; no ratings gives null", () => {
  const [a, b] = compare({ ...base, scores: { a: { cost: 5 } } });
  assert.equal(a.percent, 100);
  assert.equal(a.rated, 1);
  assert.equal(b.percent, null);
});

test("top option includes ties and is empty when nothing is rated", () => {
  const tie = compare({ ...base, scores: { a: { cost: 3 }, b: { cost: 3 } } });
  assert.deepEqual([...topOptionIds(tie)].sort(), ["a", "b"]);
  assert.equal(topOptionIds(compare(base)).size, 0);
});

const three: DecisionData = {
  ...base,
  options: [...base.options, { id: "c", name: "C" }],
};

test("summarize: needs at least two options and one criterion", () => {
  const one = { ...base, options: [base.options[0]], scores: { a: { cost: 5 } } };
  assert.equal(summarize(one).status, "need-more");
  assert.equal(summarize({ ...base, criteria: [] }).status, "need-more");
});

test("summarize: unrated, tie, close call, best match", () => {
  assert.equal(summarize(base).message, "Rate the options below to see your best match.");
  assert.equal(
    summarize({ ...base, scores: { a: { cost: 3 }, b: { cost: 3 } } }).message,
    "Tie: A, B",
  );
  // B 73%, A 70%, C 20%: top two within 5 points
  const close = summarize({
    ...three,
    scores: { a: { cost: 4, fun: 1 }, b: { cost: 4, fun: 2 }, c: { cost: 1, fun: 1 } },
  });
  assert.equal(
    close.message,
    "Too close to call: B and A. Adjust your weights or add another criterion.",
  );
  const best = summarize({ ...base, scores: { a: { cost: 5, fun: 5 }, b: { cost: 1, fun: 1 } } });
  assert.equal(best.message, "Best match: A (100%)");
  assert.equal(best.uneven, false);
});

test("summarize: flags uneven ratings", () => {
  assert.equal(summarize({ ...base, scores: { a: { cost: 5, fun: 5 }, b: { cost: 1 } } }).uneven, true);
});
