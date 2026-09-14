"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const AMAZON_TAG = "pasifikabazaa-22";
const AMAZON_PLACEHOLDER = "https://www.pasifikabazaar.com/product-images/amazon-product-placeholder.svg";

function requiredText(formData: FormData, key: string, maxLength = 180) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value || value.length > maxLength) throw new Error(`Invalid ${key}`);
  return value;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 150);
}

function amazonProductDetails(rawLine: string, lineNumber: number) {
  const separator = rawLine.indexOf("|");
  const suppliedName = separator >= 0 ? rawLine.slice(0, separator).trim() : "";
  const rawUrl = (separator >= 0 ? rawLine.slice(separator + 1) : rawLine).trim();

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(`Line ${lineNumber}: enter a valid full Amazon URL.`);
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (url.protocol !== "https:" || host !== "amazon.com.au") {
    throw new Error(`Line ${lineNumber}: use a full https://www.amazon.com.au product link.`);
  }
  if (url.searchParams.get("tag") !== AMAZON_TAG) {
    throw new Error(`Line ${lineNumber}: the link must contain your affiliate tag, ${AMAZON_TAG}.`);
  }

  const asin = url.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/i)?.[1]?.toUpperCase();
  if (!asin) throw new Error(`Line ${lineNumber}: the Amazon product code (ASIN) could not be found.`);

  const pathBeforeProduct = url.pathname.split(/\/(?:dp|gp\/product)\//i)[0];
  const inferredName = decodeURIComponent(pathBeforeProduct.split("/").filter(Boolean).pop() ?? "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
  const name = (suppliedName || inferredName || `Amazon product ${asin}`).slice(0, 180);
  if (!name) throw new Error(`Line ${lineNumber}: add a product name before the link.`);

  const cleanUrl = new URL(`https://www.amazon.com.au/dp/${asin}`);
  cleanUrl.searchParams.set("tag", AMAZON_TAG);
  return { asin, name, affiliateUrl: cleanUrl.toString(), slug: `${slugify(name)}-${asin.toLowerCase()}` };
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

export async function bulkImportAmazonProducts(formData: FormData) {
  await requireAdmin();
  const lines = String(formData.get("amazon_links") ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) redirect("/admin?bulk=empty");
  if (lines.length > 50) redirect("/admin?bulk=too-many");

  let parsed: ReturnType<typeof amazonProductDetails>[];
  try {
    parsed = lines.map((line, index) => amazonProductDetails(line, index + 1));
  } catch (error) {
    const message = error instanceof Error ? error.message : "One or more links are invalid.";
    redirect(`/admin?bulk=error&detail=${encodeURIComponent(message)}`);
  }

  const unique = [...new Map(parsed.map((product) => [product.asin, product])).values()];
  const db = getSupabaseAdmin();
  const { data: existing, error: lookupError } = await db.from("products").select("affiliate_url,slug");
  if (lookupError) redirect(`/admin?bulk=error&detail=${encodeURIComponent(lookupError.message)}`);

  const existingAsins = new Set(
    (existing ?? []).map((product) => String(product.affiliate_url ?? "").match(/\/dp\/([A-Z0-9]{10})/i)?.[1]?.toUpperCase()).filter(Boolean)
  );
  const existingSlugs = new Set((existing ?? []).map((product) => product.slug));
  const newProducts = unique.filter((product) => !existingAsins.has(product.asin) && !existingSlugs.has(product.slug));

  if (!newProducts.length) redirect(`/admin?bulk=duplicates&skipped=${lines.length}`);

  const { error } = await db.from("products").insert(newProducts.map((product) => ({
    name: product.name,
    slug: product.slug,
    description: "Explore this Amazon Australia product and check the retailer page for current details, availability and delivery options.",
    category_id: null,
    price_aud_cents: 0,
    stock_quantity: 0,
    original_price_aud_cents: null,
    image_url: AMAZON_PLACEHOLDER,
    product_type: "affiliate",
    retailer: "Amazon",
    affiliate_url: product.affiliateUrl,
    rating: null,
    review_count: 0,
    badge: null,
    is_active: false,
    is_featured: false,
  })));
  if (error) redirect(`/admin?bulk=error&detail=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin");
  revalidatePath("/");
  const skipped = lines.length - newProducts.length;
  redirect(`/admin?bulk=success&added=${newProducts.length}&skipped=${skipped}`);
}

export async function createProduct(formData: FormData) {
  await requireAdmin();
  const name = requiredText(formData, "name");
  const slug = slugify(requiredText(formData, "slug"));
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
  if (!slug || retailer !== "Amazon" || !Number.isFinite(price) || price < 0 || !Number.isInteger(reviews) || reviews < 0) throw new Error("Invalid affiliate product details.");
  const affiliate = new URL(affiliateUrl);
  if (affiliate.protocol !== "https:") throw new Error("Affiliate links must use HTTPS.");

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
