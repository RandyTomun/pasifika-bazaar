import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 400 });
  try {
    const event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
    if (event.type === "checkout.session.completed") {
      const session = await getStripe().checkout.sessions.retrieve(event.data.object.id, { expand: ["line_items"] });
      const address = session.customer_details?.address;
      const { data: order, error: orderError } = await getSupabaseAdmin().from("orders").upsert({
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
        status: session.payment_status === "paid" ? "paid" : "pending",
        customer_email: session.customer_details?.email,
        customer_name: session.customer_details?.name,
        customer_phone: session.customer_details?.phone,
        currency: session.currency || "aud",
        subtotal_cents: session.amount_subtotal || 0,
        shipping_cents: session.shipping_cost?.amount_total || 0,
        total_cents: session.amount_total || 0,
        shipping_address: address || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "stripe_checkout_session_id" }).select("id").single();
      if (orderError || !order) throw orderError || new Error("Order was not created");

      const items = session.line_items?.data || [];
      await getSupabaseAdmin().from("order_items").delete().eq("order_id", order.id);
      if (items.length) {
        const { error: itemsError } = await getSupabaseAdmin().from("order_items").insert(items.map(item => ({
          order_id: order.id,
          product_name: item.description,
          unit_price_cents: item.price?.unit_amount || 0,
          quantity: item.quantity || 1,
        })));
        if (itemsError) throw itemsError;
      }
      console.info("Payment recorded", { sessionId: session.id, orderId: order.id });
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Invalid Stripe webhook", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
