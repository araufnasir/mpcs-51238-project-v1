import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { sanitizeDecisionData } from "@/lib/decision-data";
import { DecisionEditor } from "./decision-editor";

export default async function DecisionPage({ params }: PageProps<"/decisions/[id]">) {
  const { id } = await params;
  const supabase = await getSupabase();
  // RLS returns nothing for other users' decisions; a malformed id errors. Both are a 404.
  const { data: decision } = await supabase
    .from("decisions")
    .select("id, title, data, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (!decision) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <div className="space-y-1">
        <Link href="/decisions" className="text-sm text-foreground/60 hover:underline">
          ← My decisions
        </Link>
        <h1 className="text-2xl font-semibold break-words sm:text-3xl">{decision.title}</h1>
      </div>
      <DecisionEditor
        id={decision.id}
        initialData={sanitizeDecisionData(decision.data)}
        initialUpdatedAt={decision.updated_at}
      />
    </div>
  );
}
