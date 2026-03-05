import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface ParsedSession {
  studentName: string;
  date: string;
  goals: { goalNumber: number; correct: number; total: number; notes?: string }[];
  notes?: string;
}

interface ParsedHours {
  staffName: string;
  schoolName: string;
  date: string;
  hours: number;
  description?: string;
}

type ParseResult =
  | { type: "session"; data: ParsedSession; reply: string }
  | { type: "hours"; data: ParsedHours; reply: string }
  | { type: "unknown"; reply: string };

function parseMessage(text: string): ParseResult {
  const lower = text.toLowerCase().trim();

  // --- HOURS PATTERN ---
  // "Hours: 3.5 at Gulf Coast Prep, 3/4/2026 - tutoring sessions"
  // "Logged 4 hours at Bay Point today"
  const hoursMatch = lower.match(
    /(?:hours?[:\s]+|logged?\s+)([\d.]+)\s*(?:hours?\s+)?(?:at|@)\s+(.+?)(?:\s*[,]\s*(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?))?(?:\s*[-–]\s*(.+))?$/i
  );
  if (hoursMatch) {
    const hours = parseFloat(hoursMatch[1]);
    const schoolName = hoursMatch[2].trim().replace(/[,.]$/, "");
    const dateStr = hoursMatch[3] || new Date().toISOString().split("T")[0];
    const description = hoursMatch[4]?.trim();

    return {
      type: "hours",
      data: {
        staffName: "SMS User",
        schoolName,
        date: normalizeDate(dateStr),
        hours,
        description,
      },
      reply: `Got it! Logging ${hours} hours at ${schoolName} on ${normalizeDate(dateStr)}${description ? ` (${description})` : ""}. Confirm?`,
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
    // Parse goals: "G1 8/10" or "Goal 1: 8/10" or "g1: 8/10 correct"
    const goalPattern = /(?:g|goal)\s*(\d+)\s*[:\s]\s*(\d+)\s*\/\s*(\d+)(?:\s*(?:correct|trials?))?\s*(?:[-–]\s*(.+?))?(?=\s*(?:,|g|goal|\.|$))/gi;
    const goals: { goalNumber: number; correct: number; total: number; notes?: string }[] = [];
    let goalMatch;
    while ((goalMatch = goalPattern.exec(text)) !== null) {
      goals.push({
        goalNumber: parseInt(goalMatch[1]),
        correct: parseInt(goalMatch[2]),
        total: parseInt(goalMatch[3]),
        notes: goalMatch[4]?.trim(),
      });
    }

    // Parse date from message or use today
    const dateMatch = text.match(/(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/);
    const date = dateMatch ? normalizeDate(dateMatch[1]) : new Date().toISOString().split("T")[0];

    // Session-level notes: text after the last goal match
    const lastGoalIdx = text.lastIndexOf("/");
    const afterGoals = lastGoalIdx > -1 ? text.substring(lastGoalIdx + 2).trim() : "";
    const sessionNotes = afterGoals
      .replace(/^[\d\s]*/, "")
      .replace(/^[,.\-–\s]+/, "")
      .replace(/(?:g|goal)\s*\d+.*/gi, "")
      .trim();

    // Capitalize name
    const capName = studentName.replace(/\b\w/g, (c) => c.toUpperCase());

    if (goals.length > 0) {
      const goalSummary = goals
        .map((g) => `G${g.goalNumber}: ${g.correct}/${g.total} (${Math.round((g.correct / g.total) * 100)}%)`)
        .join(", ");

      return {
        type: "session",
        data: { studentName: capName, date, goals, notes: sessionNotes || undefined },
        reply: `Session for ${capName} on ${date}:\n${goalSummary}${sessionNotes ? `\nNotes: ${sessionNotes}` : ""}\n\nConfirm to save?`,
      };
    }

    return {
      type: "unknown",
      reply: `I see you're logging a session for "${capName}" but I couldn't parse the goal data. Try this format:\n\n"Session with ${capName}: G1 8/10, G2 6/10"`,
    };
  }

  // --- HELP / UNKNOWN ---
  return {
    type: "unknown",
    reply: `I can help you log sessions or hours! Try:\n\n📝 Sessions:\n"Session with [Student]: G1 8/10, G2 6/10"\n\n⏱ Hours:\n"Hours: 3.5 at [School]"`,
  };
}

function normalizeDate(dateStr: string): string {
  if (dateStr.includes("-")) return dateStr; // already ISO
  const parts = dateStr.split("/");
  const month = parts[0].padStart(2, "0");
  const day = parts[1].padStart(2, "0");
  const year = parts[2] ? (parts[2].length === 2 ? `20${parts[2]}` : parts[2]) : new Date().getFullYear().toString();
  return `${year}-${month}-${day}`;
}

export async function POST(req: NextRequest) {
  const { message, action, data } = await req.json();

  // If confirming a previously parsed result
  if (action === "confirm") {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ reply: "Not authenticated. Please log in." });
    }

    if (data.type === "session") {
      const sessionData = data.data as ParsedSession;

      // Find student by name (fuzzy)
      const { data: students } = await supabase
        .from("students")
        .select("id, name")
        .ilike("name", `%${sessionData.studentName}%`)
        .limit(1);

      if (!students || students.length === 0) {
        return NextResponse.json({
          reply: `Couldn't find a student matching "${sessionData.studentName}". Check the name and try again, or add the student in the admin panel first.`,
        });
      }

      const student = students[0];

      // Create session
      const { data: session, error } = await supabase
        .from("sessions")
        .insert({
          student_id: student.id,
          date: sessionData.date,
          entered_by: user.id,
          notes: sessionData.notes || null,
        })
        .select()
        .single();

      if (error || !session) {
        return NextResponse.json({ reply: `Error saving session: ${error?.message}` });
      }

      // Find matching goals
      const { data: goals } = await supabase
        .from("goals")
        .select("id, goal_number")
        .eq("student_id", student.id)
        .eq("archived", false);

      // Insert session goals
      const sessionGoals = sessionData.goals
        .map((g) => {
          const matchingGoal = (goals || []).find((dbg) => dbg.goal_number === g.goalNumber);
          if (!matchingGoal) return null;
          return {
            session_id: session.id,
            goal_id: matchingGoal.id,
            correct_count: g.correct,
            total_count: g.total,
            notes: g.notes || null,
          };
        })
        .filter(Boolean);

      if (sessionGoals.length > 0) {
        await supabase.from("session_goals").insert(sessionGoals);
      }

      const unmatchedGoals = sessionData.goals.filter(
        (g) => !(goals || []).find((dbg) => dbg.goal_number === g.goalNumber)
      );

      let reply = `✅ Session saved for ${student.name}! ${sessionGoals.length} goal(s) recorded.`;
      if (unmatchedGoals.length > 0) {
        reply += `\n⚠️ Goal(s) ${unmatchedGoals.map((g) => g.goalNumber).join(", ")} not found in system — skipped.`;
      }

      return NextResponse.json({ reply });
    }

    if (data.type === "hours") {
      const hoursData = data.data as ParsedHours;

      // Find school
      const { data: schools } = await supabase
        .from("schools")
        .select("id, name")
        .ilike("name", `%${hoursData.schoolName}%`)
        .limit(1);

      if (!schools || schools.length === 0) {
        return NextResponse.json({
          reply: `Couldn't find a school matching "${hoursData.schoolName}". Check the name or add it in the admin panel first.`,
        });
      }

      const { error } = await supabase.from("hours").insert({
        user_id: user.id,
        school_id: schools[0].id,
        date: hoursData.date,
        hours: hoursData.hours,
        description: hoursData.description || null,
      });

      if (error) {
        return NextResponse.json({ reply: `Error logging hours: ${error.message}` });
      }

      return NextResponse.json({
        reply: `✅ Logged ${hoursData.hours} hours at ${schools[0].name} for ${hoursData.date}.`,
      });
    }
  }

  // Parse a new message
  const result = parseMessage(message);
  return NextResponse.json(result);
}
