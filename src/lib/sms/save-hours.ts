// Save parsed hours to the database
// Extracted from api/sms-agent for reuse by both the simulator and Twilio webhook

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParsedHours } from "./types";

interface SaveHoursResult {
  success: boolean;
  reply: string;
}

export async function saveHours(
  supabase: SupabaseClient,
  userId: string,
  hoursData: ParsedHours
): Promise<SaveHoursResult> {
  // Find school by name (fuzzy)
  const { data: schools } = await supabase
    .from("schools")
    .select("id, name")
    .ilike("name", `%${hoursData.schoolName}%`)
    .limit(1);

  if (!schools || schools.length === 0) {
    return {
      success: false,
      reply: `Couldn't find a school matching "${hoursData.schoolName}". Check the name or add it in the admin panel first.`,
    };
  }

  const { error } = await supabase.from("hours").insert({
    user_id: userId,
    school_id: schools[0].id,
    date: hoursData.date,
    hours: hoursData.hours,
    description: hoursData.description || null,
  });

  if (error) {
    return {
      success: false,
      reply: `Error logging hours: ${error.message}`,
    };
  }

  return {
    success: true,
    reply: `Logged ${hoursData.hours} hours at ${schools[0].name} for ${hoursData.date}.`,
  };
}
