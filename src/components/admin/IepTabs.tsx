"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Goal } from "@/lib/supabase/types";

interface Props {
  studentId: string;
  currentGoals: Goal[];
  archivedGoals: Goal[];
  iepDate: string | null;
}

export default function IepTabs({ studentId, currentGoals, archivedGoals, iepDate }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [tab, setTab] = useState<"current" | "previous">("current");
  const [creating, setCreating] = useState(false);

  // Group archived goals by iep_year
  const archivedByYear: Record<string, Goal[]> = {};
  archivedGoals.forEach((g) => {
    const year = g.iep_year || "Unknown";
    if (!archivedByYear[year]) archivedByYear[year] = [];
    archivedByYear[year].push(g);
  });

  async function handleNewIep() {
    const year = prompt("Enter new IEP year label (e.g., 2026-2027):");
    if (!year?.trim()) return;

    setCreating(true);

    // Archive all current goals with the user-provided IEP year label
    for (const goal of currentGoals) {
      await supabase.from("goals").update({
        archived: true,
        iep_year: year,
      }).eq("id", goal.id);
    }

    // Stamp existing (current-IEP) sessions with the year label so they bucket correctly
    await supabase.from("sessions")
      .update({ iep_year: year })
      .eq("student_id", studentId)
      .is("iep_year", null);

    // Update student's IEP date to today
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("students").update({ iep_date: today }).eq("id", studentId);

    setCreating(false);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm mb-6">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-slate-900 text-[15px]">IEP Goals</h2>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setTab("current")}
              className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                tab === "current" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Current
            </button>
            <button
              onClick={() => setTab("previous")}
              className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                tab === "previous" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Previous IEPs {Object.keys(archivedByYear).length > 0 && `(${Object.keys(archivedByYear).length})`}
            </button>
          </div>
        </div>
        <button
          onClick={handleNewIep}
          disabled={creating || currentGoals.length === 0}
          className="text-[12px] font-medium text-amber-600 hover:text-amber-700 border border-amber-200 hover:bg-amber-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          {creating ? "Creating..." : "New IEP"}
        </button>
      </div>

      {tab === "current" ? (
        currentGoals.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {currentGoals.map((goal) => (
              <div key={goal.id} className="px-5 py-3.5">
                <p className="text-[13px]">
                  <span className="font-medium text-slate-700">Goal {goal.goal_number}:</span>{" "}
                  <span className="text-slate-500">{goal.description}</span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-8 text-center text-slate-400 text-sm">No goals defined yet.</p>
        )
      ) : (
        Object.keys(archivedByYear).length > 0 ? (
          <div className="divide-y divide-slate-200">
            {Object.entries(archivedByYear).map(([year, goals]) => (
              <div key={year}>
                <div className="px-5 py-3 bg-slate-50/50">
                  <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">IEP Year: {year}</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {goals.map((goal) => (
                    <div key={goal.id} className="px-5 py-3.5">
                      <p className="text-[13px]">
                        <span className="font-medium text-slate-500">Goal {goal.goal_number}:</span>{" "}
                        <span className="text-slate-400">{goal.description}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-8 text-center text-slate-400 text-sm">No previous IEPs.</p>
        )
      )}
    </div>
  );
}
