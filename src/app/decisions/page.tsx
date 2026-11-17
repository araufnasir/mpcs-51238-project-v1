import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { btn, input } from "@/lib/ui";
import { createCarExample, createDecision } from "./actions";
import { DeleteButton } from "./delete-button";

export const metadata = { title: "My decisions · Which Way" };

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export default async function DecisionsPage() {
  const supabase = await getSupabase();
  const { data: decisions, error } = await supabase
    .from("decisions")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`Could not load decisions: ${error.message}`);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-semibold sm:text-3xl">My decisions</h1>

      <section className="space-y-3 rounded-lg border border-foreground/10 p-4 sm:p-5">
        <h2 className="font-medium">Start a new decision</h2>
        <form action={createDecision} className="flex flex-col gap-2 sm:flex-row">
          <input
            name="title"
            required
            maxLength={200}
            placeholder="e.g. Which job offer should I take?"
            className={input}
            aria-label="Decision title"
          />
          <button className={`${btn.primary} shrink-0`}>New decision</button>
        </form>
        <form action={createCarExample} className="text-sm text-foreground/70">
          Not sure how it works?{" "}
          <button className="font-medium text-foreground underline underline-offset-2">
            Try the car example
          </button>{" "}
          (buy, lease or transit, with options and criteria filled in).
        </form>
      </section>

      {decisions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-foreground/20 p-6 text-center text-foreground/70">
          You don&apos;t have any decisions yet. Give one a title above, then add
          the options you&apos;re choosing between and what matters to you.
        </p>
      ) : (
        <ul className="divide-y divide-foreground/10 rounded-lg border border-foreground/10">
          {decisions.map((d) => (
            <li key={d.id} className="flex items-center gap-3 p-4">
              <Link href={`/decisions/${d.id}`} className="min-w-0 flex-1 hover:underline">
                <span className="block truncate font-medium">{d.title}</span>
                <span className="text-sm text-foreground/60">
                  Updated {dateFormat.format(new Date(d.updated_at))}
                </span>
              </Link>
              <DeleteButton id={d.id} title={d.title} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
