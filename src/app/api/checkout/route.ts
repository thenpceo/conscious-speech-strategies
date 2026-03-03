import Stripe from "stripe";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const body = await request.json();
    const { quantity, selectedWeeks, childName, parentName, parentEmail, parentPhone } = body;

    if (!quantity || quantity < 1 || quantity > 3) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity,
        },
      ],
      mode: "payment",
      success_url: `${request.headers.get("origin")}/camps/registration-success`,
      cancel_url: `${request.headers.get("origin")}/camps/mind-body-speech/register`,
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
