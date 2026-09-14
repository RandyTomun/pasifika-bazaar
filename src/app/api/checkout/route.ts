import { NextResponse } from "next/server";
import { checkoutCatalog } from "@/lib/catalog";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { productIds?: unknown };
    if (!Array.isArray(body.productIds) || body.productIds.length === 0 || body.productIds.length > 50) {
      return NextResponse.json({ error: "Your shopping bag is invalid." }, { status: 400 });
    }
    const counts = new Map<number, number>();
    for (const rawId of body.productIds) {
      if (!Number.isInteger(rawId) || !checkoutCatalog[rawId as number]) {
        return NextResponse.json({ error: "A product is no longer available." }, { status: 400 });
      }
      const id = rawId as number;
      counts.set(id, (counts.get(id) || 0) + 1);
    }
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [...counts].map(([id, quantity]) => {
        const product = checkoutCatalog[id];
        return { quantity, price_data: { currency: "aud", unit_amount: product.unitAmount, product_data: { name: product.name, images: [product.image], metadata: { catalogId: String(id) } } } };
      }),
      shipping_address_collection: { allowed_countries: ["AU", "NZ", "PG", "FJ", "SB", "VU", "TO", "WS"] },
      phone_number_collection: { enabled: true },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancelled`,
      metadata: { source: "pasifika-bazaar" },
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout session failed", error);
    return NextResponse.json({ error: "Checkout is temporarily unavailable." }, { status: 503 });
  }
}
