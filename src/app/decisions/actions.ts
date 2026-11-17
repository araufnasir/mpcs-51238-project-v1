"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { carExample, sanitizeDecisionData } from "@/lib/decision-data";
import type { DecisionData } from "@/lib/types";

// All queries run as the signed-in Clerk user; RLS limits them to that user's rows.

async function insertDecision(title: string, data?: DecisionData) {
  const supabase = await getSupabase();
  const { data: row, error } = await supabase
    .from("decisions")
    .insert(data ? { title, data } : { title })
    .select("id")
    .single();
  if (error) throw new Error(`Could not create decision: ${error.message}`);
  redirect(`/decisions/${row.id}`);
}

export async function createDecision(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  if (!title) return;
  await insertDecision(title);
}

export async function createCarExample() {
  const { title, data } = carExample();
  await insertDecision(title, data);
}

export async function deleteDecision(formData: FormData) {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("decisions")
    .delete()
    .eq("id", String(formData.get("id")));
  if (error) throw new Error(`Could not delete decision: ${error.message}`);
  revalidatePath("/decisions");
}

export async function saveDecision(
  id: string,
  data: unknown,
): Promise<{ ok: true; updatedAt: string } | { ok: false; error: string }> {
  const supabase = await getSupabase();
  const updatedAt = new Date().toISOString();
  const { data: rows, error } = await supabase
    .from("decisions")
    .update({ data: sanitizeDecisionData(data), updated_at: updatedAt })
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!rows?.length) return { ok: false, error: "Decision not found." };
  revalidatePath("/decisions");
  return { ok: true, updatedAt };
}
