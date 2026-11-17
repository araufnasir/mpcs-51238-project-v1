import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeDecisionData } from "./decision-data.ts";

test("sanitize drops non-UUID ids like __proto__ and does not pollute Object.prototype", () => {
  const optionId = crypto.randomUUID();
  const criterionId = crypto.randomUUID();
  // JSON.parse keeps "__proto__" as an own key, like data read back from Postgres.
  const stored = JSON.parse(`{
    "options":  [{"id":"__proto__","name":"x"}, {"id":"${optionId}","name":"Real"}],
    "criteria": [{"id":"polluted","name":"y"}, {"id":"${criterionId}","name":"Price","weight":4}],
    "scores":   {"__proto__":{"polluted":5}, "${optionId}":{"${criterionId}":3, "polluted":5}}
  }`);

  const clean = sanitizeDecisionData(stored);

  assert.equal(({} as Record<string, unknown>).polluted, undefined);
  assert.deepEqual(clean.options, [{ id: optionId, name: "Real" }]);
  assert.deepEqual(clean.criteria.map((c) => c.id), [criterionId]);
  assert.deepEqual(clean.scores, { [optionId]: { [criterionId]: 3 } });
});
