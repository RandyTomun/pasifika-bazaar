import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const { productId } = await request.json() as { productId?: unknown };
    if (typeof productId !== "string" || !/^[0-9a-f-]{36}$/i.test(productId)) return new NextResponse(null, { status: 400 });
    const { data: product } = await getSupabaseAdmin().from("products").select("id,retailer,is_active,product_type").eq("id", productId).maybeSingle();
    if (!product?.is_active || product.product_type !== "affiliate" || !product.retailer) return new NextResponse(null, { status: 404 });
    await getSupabaseAdmin().from("affiliate_clicks").insert({ product_id: product.id, retailer: product.retailer });
    return new NextResponse(null, { status: 204 });
  } catch { return new NextResponse(null, { status: 400 }); }
}
