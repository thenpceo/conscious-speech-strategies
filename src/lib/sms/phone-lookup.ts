// Look up a staff profile by phone number

import type { SupabaseClient } from "@supabase/supabase-js";

interface PhoneLookupResult {
  found: boolean;
  userId?: string;
  userName?: string;
  reply?: string;
}

export async function lookupProfileByPhone(
  supabase: SupabaseClient,
  phoneNumber: string
): Promise<PhoneLookupResult> {
  // Normalize: strip spaces, dashes, parens — compare digits only
  const normalized = phoneNumber.replace(/\D/g, "");

  // Try exact match first, then partial (last 10 digits)
  const last10 = normalized.slice(-10);

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, name, phone")
    .or(`phone.ilike.%${last10}%`);

  if (error) {
    console.error("[phone-lookup] DB error:", error.message);
    return {
      found: false,
      reply: "System error looking up your number. Please try again or use the dashboard.",
    };
  }

  if (!profiles || profiles.length === 0) {
    return {
      found: false,
      reply: "I don't recognize this phone number. Ask your admin to add it to your profile in the dashboard.",
    };
  }

  if (profiles.length > 1) {
    // Multiple matches — use the one with the closest phone match
    const exact = profiles.find((p) => p.phone?.replace(/\D/g, "") === normalized);
    if (exact) {
      return { found: true, userId: exact.id, userName: exact.name };
    }
    // Take the first match
    return { found: true, userId: profiles[0].id, userName: profiles[0].name };
  }

  return {
    found: true,
    userId: profiles[0].id,
    userName: profiles[0].name,
  };
}
