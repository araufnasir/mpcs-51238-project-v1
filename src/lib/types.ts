// Shape of decisions.data (see supabase/migrations/20261117000000_create_decisions.sql).

export type Option = { id: string; name: string };

// v1 only has "rating" criteria (1-5). v2 can add numeric kinds.
export type Criterion = {
  id: string;
  name: string;
  weight: number; // 1-5
  kind: "rating";
};

// scores[optionId][criterionId] = 1-5. Missing means "not rated yet".
export type Scores = Record<string, Record<string, number>>;

export type DecisionData = {
  options: Option[];
  criteria: Criterion[];
  scores: Scores;
};

export const RATINGS = [1, 2, 3, 4, 5] as const;
