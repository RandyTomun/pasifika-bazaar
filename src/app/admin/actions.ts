"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function requiredText(formData: FormData, key: string, maxLength = 180) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value || value.length > maxLength) throw new Error(`Invalid ${key}`);
  return value;
}

export async function signIn(formData: FormData) {
  const email = requiredText(formData, "email", 320);
  const password = requiredText(formData, "password", 200);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) redirect("/admin/login?error=invalid-login");

  const { data: admin } = await getSupabaseAdmin().from("admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=not-authorized");
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function createProduct(formData: FormData) {
  await requireAdmin();
  const name = requiredText(formData, "name");
  const slug = requiredText(formData, "slug").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const description = String(formData.get("description") ?? "").trim().slice(0, 2000);
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "").trim() || null;
  const price = Number(formData.get("price_aud"));
  const stock = Number(formData.get("stock_quantity"));
  if (!slug || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) throw new Error("Invalid product price, stock, or slug.");
  if (imageUrl && new URL(imageUrl).protocol !== "https:") throw new Error("Product images must use HTTPS.");

  const { error } = await getSupabaseAdmin().from("products").insert({
    name, slug, description, category_id: categoryId, price_aud_cents: Math.round(price * 100), stock_quantity: stock,
    image_url: imageUrl || null, is_active: formData.get("is_active") === "on", is_featured: formData.get("is_featured") === "on",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function toggleProduct(formData: FormData) {
  await requireAdmin();
  const id = requiredText(formData, "id", 50);
  const active = formData.get("active") === "true";
  const { error } = await getSupabaseAdmin().from("products").update({ is_active: active, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/");
}
