// Save a parsed session to the database
// Extracted from api/sms-agent for reuse by both the simulator and Twilio webhook

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParsedSession } from "./types";

interface SaveSessionResult {
  success: boolean;
  reply: string;
  sessionId?: string;
}

export async function saveSession(
  supabase: SupabaseClient,
  userId: string,
  sessionData: ParsedSession
): Promise<SaveSessionResult> {
  // Find student by name (fuzzy)
  const { data: students } = await supabase
    .from("students")
    .select("id, name, school:schools(name)")
    .ilike("name", `%${sessionData.studentName}%`)
    .limit(1);

  if (!students || students.length === 0) {
    return {
      success: false,
      reply: `Couldn't find a student matching "${sessionData.studentName}". Check the name and try again, or add the student in the admin panel first.`,
    };
  }

  const student = students[0];

  // Create session
  const { data: session, error } = await supabase
    .from("sessions")
    .insert({
      student_id: student.id,
      date: sessionData.date,
      entered_by: userId,
      notes: sessionData.notes || null,
    })
    .select()
    .single();

  if (error || !session) {
    return {
      success: false,
      reply: `Error saving session: ${error?.message || "Unknown error"}`,
    };
  }

  // Find matching goals for this student
  const { data: goals } = await supabase
    .from("goals")
    .select("id, goal_number")
    .eq("student_id", student.id)
    .eq("archived", false);

  // Insert session goals
  const sessionGoals = sessionData.goals
    .map((g) => {
      const matchingGoal = (goals || []).find(
        (dbg) => dbg.goal_number === g.goalNumber
      );
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
    const { error: goalsError } = await supabase
      .from("session_goals")
      .insert(sessionGoals);
    if (goalsError) {
      return {
        success: false,
        reply: `Session created but error saving goals: ${goalsError.message}`,
      };
    }
  }

  const unmatchedGoals = sessionData.goals.filter(
    (g) => !(goals || []).find((dbg) => dbg.goal_number === g.goalNumber)
  );

  // Include school name in confirmation for disambiguation
  const schoolName =
    student.school && typeof student.school === "object" && "name" in student.school
      ? ` at ${(student.school as { name: string }).name}`
      : "";

  let reply = `Session saved for ${student.name}${schoolName}! ${sessionGoals.length} goal(s) recorded.`;
  if (unmatchedGoals.length > 0) {
    reply += `\nGoal(s) ${unmatchedGoals.map((g) => g.goalNumber).join(", ")} not found in system — skipped.`;
  }

  return { success: true, reply, sessionId: session.id };
}
