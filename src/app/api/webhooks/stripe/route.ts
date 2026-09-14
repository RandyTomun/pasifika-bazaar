import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 400 });
  try {
    const event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.info("Payment completed", { sessionId: session.id, paymentStatus: session.payment_status });
      // Order persistence and fulfilment notification will be added with the production database.
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Invalid Stripe webhook", error);
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }
}
