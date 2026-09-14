import "server-only";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/admin/login");

  const { data: admin } = await getSupabaseAdmin().from("admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
  if (!admin) redirect("/admin/login?error=not-authorized");
  return data.user;
}
