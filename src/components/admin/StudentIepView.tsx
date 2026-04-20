"use client";

import { useState } from "react";
import IepTabs from "./IepTabs";
import SessionHistory from "./SessionHistory";
import type { Goal, StudentIep } from "@/lib/supabase/types";

interface SessionGoalData {
  id: string;
  goal_id: string;
  correct_count: number;
  total_count: number;
  percentage: number;
  target: string | null;
  performance_level: string | null;
  notes: string | null;
  goal: { goal_number: number; description: string; iep_year: string | null } | null;
}

interface SessionData {
  id: string;
  student_id: string;
  date: string;
  notes: string | null;
  iep_year: string | null;
  entered_by_profile: { name: string } | null;
  session_goals: SessionGoalData[];
}

interface Props {
  studentId: string;
  currentGoals: Goal[];
  archivedGoals: Goal[];
  iepMeta: StudentIep[];
  sessions: SessionData[];
}

export default function StudentIepView({ studentId, currentGoals, archivedGoals, iepMeta, sessions }: Props) {
  // "current" means iep_year=null; any other string is an archived iep_year
  const [activeIepYear, setActiveIepYear] = useState<string | null>(null);

  return (
    <>
      <IepTabs
        studentId={studentId}
        currentGoals={currentGoals}
        archivedGoals={archivedGoals}
        iepMeta={iepMeta}
        onTabChange={setActiveIepYear}
      />
      <SessionHistory
        sessions={sessions}
        studentId={studentId}
        currentGoals={currentGoals}
        archivedGoals={archivedGoals}
        filterIepYear={activeIepYear}
      />
    </>
  );
}
