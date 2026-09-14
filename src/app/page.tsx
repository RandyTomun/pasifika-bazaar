import Marketplace from "./marketplace";
import type { AffiliateProduct } from "@/lib/catalog";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data } = await getSupabaseAdmin().from("products").select("id,name,slug,description,price_aud_cents,original_price_aud_cents,image_url,badge,retailer,affiliate_url,rating,review_count,categories(name)").eq("is_active", true).eq("product_type", "affiliate").order("is_featured", { ascending: false }).order("created_at", { ascending: false });
  const products: AffiliateProduct[] = (data ?? []).filter((p) => p.retailer && p.affiliate_url && p.image_url).map((p) => ({
    id: p.id, name: p.name, slug: p.slug, description: p.description, price: p.price_aud_cents / 100,
    originalPrice: p.original_price_aud_cents ? p.original_price_aud_cents / 100 : null, image: p.image_url!, badge: p.badge,
    retailer: p.retailer as AffiliateProduct["retailer"], affiliateUrl: p.affiliate_url!, rating: p.rating ? Number(p.rating) : null,
    reviews: p.review_count, category: Array.isArray(p.categories) ? p.categories[0]?.name ?? "Other" : (p.categories as { name?: string } | null)?.name ?? "Other",
  }));
  return <Marketplace products={products} />;
}
