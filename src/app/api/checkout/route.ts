import Stripe from "stripe";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!secretKey || !priceId) {
    console.error("Missing STRIPE_SECRET_KEY or STRIPE_PRICE_ID environment variables");
    return NextResponse.json({ error: "Payment service unavailable" }, { status: 503 });
  }

  const origin =
    request.headers.get("origin") ||
    `https://${request.headers.get("host")}`;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { quantity, selectedWeeks, childName, parentName, parentEmail, parentPhone } = body;

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 3) {
    return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
  }

  try {
    const stripe = new Stripe(secretKey);

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity,
        },
      ],
      mode: "payment",
      success_url: `${origin}/camps/registration-success`,
      cancel_url: `${origin}/camps/mind-body-speech/register`,
      metadata: {
        child_name: childName || "",
        weeks_selected: selectedWeeks || "",
        parent_name: parentName || "",
        parent_email: parentEmail || "",
        parent_phone: parentPhone || "",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
