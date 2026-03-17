// SMS System Types
// Shared across: ai-parser, regex-parser, save functions, webhook, sms-agent

export interface ParsedSession {
  studentName: string;
  date: string;
  goals: { goalNumber: number; correct: number; total: number; notes?: string }[];
  notes?: string;
}

export interface ParsedHours {
  schoolName: string;
  date: string;
  hours: number;
  description?: string;
}

export type ParseResult =
  | { type: "session"; data: ParsedSession; reply: string; confidence?: number }
  | { type: "hours"; data: ParsedHours; reply: string; confidence?: number }
  | { type: "unknown"; reply: string };

export type ParseMethod = "ai" | "regex" | "vision";

export type ConversationState =
  | "idle"
  | "confirming"
  | "saved"
  | "cancelled"
  | "expired";

export type MessageDirection = "inbound" | "outbound";

export type MessageStatus =
  | "received"
  | "parsed"
  | "confirmed"
  | "saved"
  | "failed"
  | "expired";

// Quick-reply shortcuts that count as "yes" or "no"
export const CONFIRM_KEYWORDS = ["y", "yes", "yeah", "yep", "yup", "confirm", "ok", "1", "👍", "✅"];
export const CANCEL_KEYWORDS = ["n", "no", "nah", "nope", "cancel", "discard", "x", "2", "👎", "❌"];
export const HELP_KEYWORDS = ["help", "?", "commands", "how", "info"];
