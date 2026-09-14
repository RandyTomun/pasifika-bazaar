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
  let imageUrl = String(formData.get("image_url") ?? "").trim();
  const imageFile = formData.get("image_file");
  const categoryId = String(formData.get("category_id") ?? "").trim() || null;
  const retailer = requiredText(formData, "retailer", 30);
  const affiliateUrl = requiredText(formData, "affiliate_url", 2000);
  const price = Number(formData.get("price_aud"));
  const originalPrice = Number(formData.get("original_price_aud"));
  const rating = Number(formData.get("rating"));
  const reviews = Number(formData.get("review_count"));
  if (!slug || !["Amazon", "eBay", "AliExpress"].includes(retailer) || !Number.isFinite(price) || price < 0 || !Number.isInteger(reviews) || reviews < 0) throw new Error("Invalid affiliate product details.");
  if (new URL(affiliateUrl).protocol !== "https:") throw new Error("Affiliate links must use HTTPS.");

  if (imageFile instanceof File && imageFile.size > 0) {
    if (imageFile.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(imageFile.type)) throw new Error("Upload a JPG, PNG or WebP image smaller than 5MB.");
    const extension = imageFile.type === "image/png" ? "png" : imageFile.type === "image/webp" ? "webp" : "jpg";
    const path = `${crypto.randomUUID()}.${extension}`;
    const db = getSupabaseAdmin();
    const { error: uploadError } = await db.storage.from("product-images").upload(path, imageFile, { contentType: imageFile.type, upsert: false });
    if (uploadError) throw new Error(uploadError.message);
    imageUrl = db.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  }
  if (imageUrl && new URL(imageUrl).protocol !== "https:") throw new Error("Product images must use HTTPS.");
  if (!imageUrl) throw new Error("Upload a product image or provide an HTTPS image URL.");

  const { error } = await getSupabaseAdmin().from("products").insert({
    name, slug, description, category_id: categoryId, price_aud_cents: Math.round(price * 100), stock_quantity: 0,
    original_price_aud_cents: Number.isFinite(originalPrice) && originalPrice > 0 ? Math.round(originalPrice * 100) : null,
    image_url: imageUrl, product_type: "affiliate", retailer, affiliate_url: affiliateUrl,
    rating: Number.isFinite(rating) && rating >= 0 && rating <= 5 ? rating : null, review_count: reviews,
    badge: String(formData.get("badge") ?? "").trim().slice(0, 40) || null,
    is_active: formData.get("is_active") === "on", is_featured: formData.get("is_featured") === "on",
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
