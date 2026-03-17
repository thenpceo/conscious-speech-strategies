// Regex-based SMS parser — fallback when AI is unavailable or times out
//
//  INPUT TEXT ──▶ HOURS PATTERN? ──yes──▶ ParsedHours
//       │                │
//       │               no
//       ▼                │
//  SESSION PATTERN? ─yes─┼──▶ GOALS FOUND? ──yes──▶ ParsedSession
//       │                │        │
//       │               no       no
//       ▼                │        ▼
//  UNKNOWN ◀─────────────┘   UNKNOWN (suggest format)

import type { ParseResult } from "./types";

export function normalizeDate(dateStr: string): string {
  if (dateStr.includes("-")) return dateStr; // already ISO
  const parts = dateStr.split("/");
  const month = parts[0].padStart(2, "0");
  const day = parts[1].padStart(2, "0");
  const year = parts[2]
    ? parts[2].length === 2
      ? `20${parts[2]}`
      : parts[2]
    : new Date().getFullYear().toString();
  return `${year}-${month}-${day}`;
}

export function parseMessageRegex(text: string): ParseResult {
  const lower = text.toLowerCase().trim();

  // --- HOURS PATTERN ---
  // "Hours: 3.5 at Gulf Coast Prep, 3/4/2026 - tutoring sessions"
  // "Logged 4 hours at Bay Point today"
  const hoursMatch = lower.match(
    /(?:hours?[:\s]+|logged?\s+)([\d.]+)\s*(?:hours?\s+)?(?:at|@)\s+(.+?)(?:\s*[,]\s*(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?))?(?:\s*[-–]\s*(.+))?$/i
  );
  if (hoursMatch) {
    const hours = parseFloat(hoursMatch[1]);
    const schoolName = hoursMatch[2]
      .trim()
      .replace(/[,.]$/, "")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const dateStr =
      hoursMatch[3] || new Date().toISOString().split("T")[0];
    const description = hoursMatch[4]?.trim();

    return {
      type: "hours",
      data: {
        schoolName,
        date: normalizeDate(dateStr),
        hours,
        description,
      },
      reply: `Got it! Logging ${hours} hours at ${schoolName} on ${normalizeDate(dateStr)}${description ? ` (${description})` : ""}. Reply Y to confirm or N to cancel.`,
    };
  }

  // --- SESSION PATTERN ---
  // "Session with John Smith: G1 8/10, G2 6/10. Good progress today"
  // "John Smith session 3/4 - Goal 1: 8/10 correct, Goal 2: 5/10"
  const sessionPatterns = [
    /(?:session\s+(?:with|for)\s+)(.+?)(?:\s*[:\-–]\s*|\s*$)/i,
    /^(.+?)\s+session/i,
  ];

  let studentName = "";
  for (const pat of sessionPatterns) {
    const m = lower.match(pat);
    if (m) {
      studentName = m[1].trim();
      break;
    }
  }

  if (studentName) {
    const goalPattern =
      /(?:g|goal)\s*(\d+)\s*[:\s]\s*(\d+)\s*\/\s*(\d+)(?:\s*(?:correct|trials?))?\s*(?:[-–]\s*(.+?))?(?=\s*(?:,|g|goal|\.|$))/gi;
    const goals: {
      goalNumber: number;
      correct: number;
      total: number;
      notes?: string;
    }[] = [];
    let goalMatch;
    while ((goalMatch = goalPattern.exec(text)) !== null) {
      goals.push({
        goalNumber: parseInt(goalMatch[1]),
        correct: parseInt(goalMatch[2]),
        total: parseInt(goalMatch[3]),
        notes: goalMatch[4]?.trim(),
      });
    }

    const dateMatch = text.match(/(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/);
    const date = dateMatch
      ? normalizeDate(dateMatch[1])
      : new Date().toISOString().split("T")[0];

    const lastGoalIdx = text.lastIndexOf("/");
    const afterGoals =
      lastGoalIdx > -1 ? text.substring(lastGoalIdx + 2).trim() : "";
    const sessionNotes = afterGoals
      .replace(/^[\d\s]*/, "")
      .replace(/^[,.\-–\s]+/, "")
      .replace(/(?:g|goal)\s*\d+.*/gi, "")
      .trim();

    const capName = studentName.replace(/\b\w/g, (c) => c.toUpperCase());

    if (goals.length > 0) {
      const goalSummary = goals
        .map(
          (g) =>
            `G${g.goalNumber}: ${g.correct}/${g.total} (${Math.round((g.correct / g.total) * 100)}%)`
        )
        .join(", ");

      return {
        type: "session",
        data: {
          studentName: capName,
          date,
          goals,
          notes: sessionNotes || undefined,
        },
        reply: `Session for ${capName} on ${date}:\n${goalSummary}${sessionNotes ? `\nNotes: ${sessionNotes}` : ""}\n\nReply Y to confirm or N to cancel.`,
      };
    }

    return {
      type: "unknown",
      reply: `I see you're logging a session for "${capName}" but I couldn't parse the goal data. Try this format:\n\n"Session with ${capName}: G1 8/10, G2 6/10"`,
    };
  }

  // --- UNKNOWN ---
  return {
    type: "unknown",
    reply: `I can help you log sessions or hours! Try:\n\nSessions:\n"Session with [Student]: G1 8/10, G2 6/10"\n\nHours:\n"Hours: 3.5 at [School]"\n\nReply HELP for more info.`,
  };
}
