// SMS Conversation state machine
//
//  ┌─────────┐   incoming    ┌───────────┐   "y"    ┌────────┐
//  │  IDLE   │──────msg─────▶│CONFIRMING │────────▶ │ SAVED  │
//  └─────────┘               └─────┬─────┘          └────────┘
//       ▲                          │
//       │                     "n"  │  timeout
//       │                          ▼
//       │                    ┌───────────┐
//       └────────────────────│CANCELLED/ │
//                            │ EXPIRED   │
//                            └───────────┘

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParseResult, ConversationState } from "./types";

interface Conversation {
  id: string;
  user_id: string;
  state: ConversationState;
  pending_data: ParseResult | null;
  pending_type: string | null;
  last_session_id: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

const CONVERSATION_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function getOrCreateConversation(
  supabase: SupabaseClient,
  userId: string
): Promise<Conversation> {
  // Find active (non-expired) conversation for this user
  const { data: existing } = await supabase
    .from("sms_conversations")
    .select("*")
    .eq("user_id", userId)
    .in("state", ["confirming"])
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1);

  if (existing && existing.length > 0) {
    return existing[0] as Conversation;
  }

  // Create new conversation
  const { data: created, error } = await supabase
    .from("sms_conversations")
    .insert({
      user_id: userId,
      state: "idle",
      pending_data: null,
      pending_type: null,
      expires_at: new Date(Date.now() + CONVERSATION_TTL_MS).toISOString(),
    })
    .select()
    .single();

  if (error || !created) {
    throw new Error(`Failed to create conversation: ${error?.message}`);
  }

  return created as Conversation;
}

export async function setPendingConfirmation(
  supabase: SupabaseClient,
  conversationId: string,
  parseResult: ParseResult
): Promise<void> {
  const { error } = await supabase
    .from("sms_conversations")
    .update({
      state: "confirming",
      pending_data: parseResult as unknown as Record<string, unknown>,
      pending_type: parseResult.type,
      expires_at: new Date(Date.now() + CONVERSATION_TTL_MS).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  if (error) {
    throw new Error(`Failed to update conversation: ${error.message}`);
  }
}

export async function resolveConversation(
  supabase: SupabaseClient,
  conversationId: string,
  state: "saved" | "cancelled" | "expired",
  sessionId?: string
): Promise<void> {
  const { error } = await supabase
    .from("sms_conversations")
    .update({
      state,
      last_session_id: sessionId || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  if (error) {
    throw new Error(`Failed to resolve conversation: ${error.message}`);
  }
}

export async function getLastSavedSessionToday(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("sms_conversations")
    .select("last_session_id")
    .eq("user_id", userId)
    .eq("state", "saved")
    .gte("updated_at", `${today}T00:00:00`)
    .order("updated_at", { ascending: false })
    .limit(1);

  return data?.[0]?.last_session_id || null;
}
