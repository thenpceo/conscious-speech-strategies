// Twilio webhook signature validation
// Uses the official Twilio SDK to verify request authenticity

import twilio from "twilio";

export function validateTwilioSignature(
  signature: string | null,
  url: string,
  params: Record<string, string>
): boolean {
  if (!signature) return false;

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.error("[sms-webhook] TWILIO_AUTH_TOKEN not set");
    return false;
  }

  return twilio.validateRequest(authToken, signature, url, params);
}
