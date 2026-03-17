// SMS Agent API — used by the SMS Simulator (/admin/sms-sim)
// Refactored to use shared modules (ai-parser, save-session, save-hours)

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { parseMessageAI } from "@/lib/sms/ai-parser";
import { saveSession } from "@/lib/sms/save-session";
import { saveHours } from "@/lib/sms/save-hours";
import { HELP_KEYWORDS } from "@/lib/sms/types";
import type { ParsedSession, ParsedHours } from "@/lib/sms/types";

const HELP_TEXT = `I can help you log sessions or hours! Try:

Sessions:
"Session with [Student]: G1 8/10, G2 6/10"

Hours:
"Hours: 3.5 at [School]"
"Logged 4 hours at [School]"

You can also describe sessions in natural language — the AI will figure it out!`;

export async function POST(req: NextRequest) {
  const { message, action, data } = await req.json();

  // If confirming a previously parsed result
  if (action === "confirm") {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ reply: "Not authenticated. Please log in." });
    }

    if (data.type === "session") {
      const result = await saveSession(
        supabase,
        user.id,
        data.data as ParsedSession
      );
      return NextResponse.json({ reply: result.reply });
    }

    if (data.type === "hours") {
      const result = await saveHours(
        supabase,
        user.id,
        data.data as ParsedHours
      );
      return NextResponse.json({ reply: result.reply });
    }
  }

  // Check for help keyword
  if (HELP_KEYWORDS.includes(message?.toLowerCase().trim())) {
    return NextResponse.json({ type: "unknown", reply: HELP_TEXT });
  }

  // Parse with AI (falls back to regex internally)
  const { result } = await parseMessageAI({ text: message });
  return NextResponse.json(result);
}
