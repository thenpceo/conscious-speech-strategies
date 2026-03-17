// AI-powered SMS parser using Claude API
//
//  TEXT/IMAGE ──▶ CLAUDE API ──▶ JSON PARSE ──▶ ParseResult
//       │              │              │
//       │         [timeout?]    [malformed?]
//       │         [429?]        [refusal?]
//       │         [error?]      [empty?]
//       │              │              │
//       │              ▼              ▼
//       └─────────▶ REGEX FALLBACK ──▶ ParseResult

import Anthropic from "@anthropic-ai/sdk";
import type { ParseResult, ParseMethod } from "./types";
import { parseMessageRegex } from "./regex-parser";

const SYSTEM_PROMPT = `You are an SMS parsing assistant for a speech therapy practice management system.
Parse incoming text messages from staff into structured data.

Staff send two types of messages:
1. SESSION DATA: Recording a therapy session with a student, including goal performance.
   Example: "Session with John Smith: G1 8/10, G2 6/10. Good progress today"

2. HOURS LOG: Recording hours worked at a school.
   Example: "Hours: 3.5 at Gulf Coast Prep - speech sessions"

Respond ONLY with valid JSON in one of these formats:

For sessions:
{"type":"session","studentName":"Full Name","date":"YYYY-MM-DD","goals":[{"goalNumber":1,"correct":8,"total":10}],"notes":"optional notes"}

For hours:
{"type":"hours","schoolName":"School Name","date":"YYYY-MM-DD","hours":3.5,"description":"optional description"}

If the message is unclear or you cannot parse it:
{"type":"unknown","reason":"brief explanation"}

Rules:
- If no date is mentioned, use today: ${new Date().toISOString().split("T")[0]}
- Goal numbers should be integers (G1 = 1, Goal 2 = 2)
- Hours should be a decimal number
- Capitalize names properly
- Extract session notes from any text after the goal data
- Be generous in interpretation — staff text casually`;

const VISION_PROMPT = `You are looking at an image sent by a speech therapy staff member.
It is likely a photo of a whiteboard, notepad, or form with session data or hours logged.

Extract the data and respond with the same JSON format:

For sessions:
{"type":"session","studentName":"Full Name","date":"YYYY-MM-DD","goals":[{"goalNumber":1,"correct":8,"total":10}],"notes":"optional notes"}

For hours:
{"type":"hours","schoolName":"School Name","date":"YYYY-MM-DD","hours":3.5,"description":"optional description"}

If you cannot read the image or it doesn't contain session/hours data:
{"type":"unknown","reason":"brief explanation"}

Use today's date if none is visible: ${new Date().toISOString().split("T")[0]}`;

let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

interface AIParseOptions {
  text?: string;
  imageUrl?: string;
  imageBase64?: string;
  imageMediaType?: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  timeoutMs?: number;
}

export async function parseMessageAI(
  options: AIParseOptions
): Promise<{ result: ParseResult; method: ParseMethod; confidence: number }> {
  const { text, imageUrl, imageBase64, imageMediaType, timeoutMs = 10000 } = options;

  try {
    const client = getClient();

    // Build message content
    const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

    if (imageBase64 && imageMediaType) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: imageMediaType,
          data: imageBase64,
        },
      });
    } else if (imageUrl) {
      content.push({
        type: "image",
        source: {
          type: "url",
          url: imageUrl,
        },
      });
    }

    if (text) {
      content.push({ type: "text", text });
    }

    const isVision = !!(imageUrl || imageBase64);
    const systemPrompt = isVision ? VISION_PROMPT : SYSTEM_PROMPT;

    // Call Claude with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let response: Anthropic.Message;
    try {
      response = await client.messages.create(
        {
          model: "claude-haiku-4-5-20251001",
          max_tokens: 512,
          system: systemPrompt,
          messages: [{ role: "user", content }],
        },
        { signal: controller.signal }
      );
    } finally {
      clearTimeout(timeout);
    }

    // Extract text from response
    const responseText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    if (!responseText.trim()) {
      throw new Error("Empty AI response");
    }

    // Parse JSON from response (handle markdown code blocks)
    const jsonStr = responseText.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    if (parsed.type === "session" && parsed.studentName && parsed.goals?.length > 0) {
      const goalSummary = parsed.goals
        .map(
          (g: { goalNumber: number; correct: number; total: number }) =>
            `G${g.goalNumber}: ${g.correct}/${g.total} (${Math.round((g.correct / g.total) * 100)}%)`
        )
        .join(", ");

      return {
        result: {
          type: "session",
          data: {
            studentName: parsed.studentName,
            date: parsed.date || new Date().toISOString().split("T")[0],
            goals: parsed.goals,
            notes: parsed.notes,
          },
          reply: `Session for ${parsed.studentName} on ${parsed.date || "today"}:\n${goalSummary}${parsed.notes ? `\nNotes: ${parsed.notes}` : ""}\n\nReply Y to confirm or N to cancel.`,
          confidence: 0.9,
        },
        method: isVision ? "vision" : "ai",
        confidence: 0.9,
      };
    }

    if (parsed.type === "hours" && parsed.schoolName && parsed.hours) {
      return {
        result: {
          type: "hours",
          data: {
            schoolName: parsed.schoolName,
            date: parsed.date || new Date().toISOString().split("T")[0],
            hours: parsed.hours,
            description: parsed.description,
          },
          reply: `Logging ${parsed.hours} hours at ${parsed.schoolName} on ${parsed.date || "today"}${parsed.description ? ` (${parsed.description})` : ""}.\n\nReply Y to confirm or N to cancel.`,
          confidence: 0.85,
        },
        method: isVision ? "vision" : "ai",
        confidence: 0.85,
      };
    }

    if (parsed.type === "unknown") {
      // AI couldn't parse — try regex as backup
      if (text) {
        const regexResult = parseMessageRegex(text);
        if (regexResult.type !== "unknown") {
          return { result: regexResult, method: "regex", confidence: 0.7 };
        }
      }

      return {
        result: {
          type: "unknown",
          reply: isVision
            ? `I couldn't read that clearly. Can you type it out instead?\n\nTry: "Session with [Student]: G1 8/10, G2 6/10"`
            : `I wasn't sure what to do with that. Try:\n\nSessions: "Session with [Student]: G1 8/10, G2 6/10"\nHours: "Hours: 3.5 at [School]"\n\nReply HELP for more info.`,
        },
        method: isVision ? "vision" : "ai",
        confidence: 0,
      };
    }

    // Unexpected format — fall back to regex
    throw new Error("Unexpected AI response format");
  } catch (error) {
    // AI failed — fall back to regex parser
    if (text) {
      const regexResult = parseMessageRegex(text);
      return { result: regexResult, method: "regex", confidence: 0.7 };
    }

    // Image-only with AI failure — can't fall back to regex
    return {
      result: {
        type: "unknown",
        reply: "I had trouble processing that image. Could you type the info instead?\n\nTry: \"Session with [Student]: G1 8/10, G2 6/10\"",
      },
      method: "vision",
      confidence: 0,
    };
  }
}
