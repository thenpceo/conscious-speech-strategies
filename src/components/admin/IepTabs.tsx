"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Goal, StudentIep } from "@/lib/supabase/types";

interface Props {
  studentId: string;
  currentGoals: Goal[];
  archivedGoals: Goal[];
  iepMeta: StudentIep[];
}

export default function IepTabs({ studentId, currentGoals: initialCurrentGoals, archivedGoals: initialArchivedGoals, iepMeta: initialMeta }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [tab, setTab] = useState<"current" | "previous">("current");
  const [busy, setBusy] = useState(false);

  // Editable state for goals
  const [currentGoals, setCurrentGoals] = useState(initialCurrentGoals);
  const [archivedGoals, setArchivedGoals] = useState(initialArchivedGoals);
  const [iepMeta, setIepMeta] = useState(initialMeta);

  // Inline editing state
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [addingTo, setAddingTo] = useState<string | null>(null); // iep_year or "__current__"
  const [newGoalText, setNewGoalText] = useState("");

  // IEP metadata editing
  const [editingMeta, setEditingMeta] = useState<string | null>(null); // iep id
  const [metaForm, setMetaForm] = useState({ iep_date: "", service_minutes: "" });

  // Get metadata for a specific IEP year
  function getMeta(iepYear: string | null) {
    return iepMeta.find((m) => m.iep_year === iepYear) || null;
  }

  // Group archived goals by iep_year
  const archivedByYear: Record<string, Goal[]> = {};
  archivedGoals.forEach((g) => {
    const year = g.iep_year || "Unknown";
    if (!archivedByYear[year]) archivedByYear[year] = [];
    archivedByYear[year].push(g);
  });

  // --- Goal CRUD ---

  async function startEditGoal(goal: Goal) {
    setEditingGoal(goal.id);
    setEditText(goal.description);
  }

  async function saveEditGoal(goalId: string) {
    if (!editText.trim()) return;
    setBusy(true);
    await supabase.from("goals").update({ description: editText.trim() }).eq("id", goalId);
    // Update local state
    setCurrentGoals((prev) => prev.map((g) => g.id === goalId ? { ...g, description: editText.trim() } : g));
    setArchivedGoals((prev) => prev.map((g) => g.id === goalId ? { ...g, description: editText.trim() } : g));
    setEditingGoal(null);
    setBusy(false);
  }

  async function deleteGoal(goalId: string, isCurrent: boolean) {
    if (!confirm("Delete this goal? This cannot be undone.")) return;
    setBusy(true);
    // Delete session_goals referencing this goal first
    await supabase.from("session_goals").delete().eq("goal_id", goalId);
    await supabase.from("goals").delete().eq("id", goalId);

    if (isCurrent) {
      const remaining = currentGoals.filter((g) => g.id !== goalId);
      // Renumber
      for (let i = 0; i < remaining.length; i++) {
        if (remaining[i].goal_number !== i + 1) {
          await supabase.from("goals").update({ goal_number: i + 1 }).eq("id", remaining[i].id);
          remaining[i] = { ...remaining[i], goal_number: i + 1 };
        }
      }
      setCurrentGoals(remaining);
    } else {
      const remaining = archivedGoals.filter((g) => g.id !== goalId);
      setArchivedGoals(remaining);
    }
    setBusy(false);
  }

  async function addGoal(iepYear: string | null, archived: boolean) {
    if (!newGoalText.trim()) return;
    setBusy(true);

    const goals = iepYear === null ? currentGoals : archivedGoals.filter((g) => g.iep_year === iepYear);
    const nextNum = goals.length > 0 ? Math.max(...goals.map((g) => g.goal_number)) + 1 : 1;

    const { data } = await supabase.from("goals").insert({
      student_id: studentId,
      goal_number: nextNum,
      description: newGoalText.trim(),
      iep_year: iepYear,
      archived,
    }).select().single();

    if (data) {
      if (iepYear === null) {
        setCurrentGoals([...currentGoals, data]);
      } else {
        setArchivedGoals([...archivedGoals, data]);
      }
    }

    setNewGoalText("");
    setAddingTo(null);
    setBusy(false);
  }

  // --- IEP Metadata ---

  function startEditMeta(meta: StudentIep) {
    setEditingMeta(meta.id);
    setMetaForm({
      iep_date: meta.iep_date || "",
      service_minutes: meta.service_minutes || "",
    });
  }

  async function saveMetaEdit(metaId: string, iepYear: string | null) {
    setBusy(true);
    if (metaId) {
      await supabase.from("student_ieps").update({
        iep_date: metaForm.iep_date || null,
        service_minutes: metaForm.service_minutes || null,
      }).eq("id", metaId);
      setIepMeta((prev) => prev.map((m) => m.id === metaId ? { ...m, iep_date: metaForm.iep_date || null, service_minutes: metaForm.service_minutes || null } : m));
    } else {
      // Create new metadata record
      const { data } = await supabase.from("student_ieps").insert({
        student_id: studentId,
        iep_year: iepYear,
        iep_date: metaForm.iep_date || null,
        service_minutes: metaForm.service_minutes || null,
      }).select().single();
      if (data) setIepMeta([...iepMeta, data]);
    }
    setEditingMeta(null);
    setBusy(false);
  }

  // --- IEP Operations ---

  async function deleteIep(year: string) {
    if (!confirm(`Permanently delete all goals and sessions from the "${year}" IEP? This cannot be undone.`)) return;
    setBusy(true);
    await supabase.from("sessions").delete().eq("student_id", studentId).eq("iep_year", year);
    await supabase.from("goals").delete().eq("student_id", studentId).eq("iep_year", year);
    await supabase.from("student_ieps").delete().eq("student_id", studentId).eq("iep_year", year);
    setArchivedGoals((prev) => prev.filter((g) => g.iep_year !== year));
    setIepMeta((prev) => prev.filter((m) => m.iep_year !== year));
    setBusy(false);
  }

  async function makeCurrent(year: string) {
    let archiveLabel: string | null = null;
    if (currentGoals.length > 0) {
      archiveLabel = prompt(
        `You have a current IEP with ${currentGoals.length} goal(s). Enter a label to archive it under (e.g., 2026-2027) before making "${year}" current:`
      );
      if (!archiveLabel?.trim()) return;
      archiveLabel = archiveLabel.trim();
      if (archiveLabel === year) {
        alert("Label conflicts with the IEP you're promoting. Pick a different label.");
        return;
      }
    } else if (!confirm(`Make the "${year}" IEP the current IEP?`)) {
      return;
    }

    setBusy(true);

    if (archiveLabel) {
      await supabase.from("goals").update({ archived: true, iep_year: archiveLabel })
        .eq("student_id", studentId).eq("archived", false).is("iep_year", null);
      await supabase.from("sessions").update({ iep_year: archiveLabel })
        .eq("student_id", studentId).is("iep_year", null);
      // Move current IEP metadata to archived
      const currentMeta = getMeta(null);
      if (currentMeta) {
        await supabase.from("student_ieps").update({ iep_year: archiveLabel }).eq("id", currentMeta.id);
      }
    }

    await supabase.from("goals").update({ archived: false, iep_year: null })
      .eq("student_id", studentId).eq("iep_year", year);
    await supabase.from("sessions").update({ iep_year: null })
      .eq("student_id", studentId).eq("iep_year", year);
    // Move promoted IEP metadata to current
    const promotedMeta = iepMeta.find((m) => m.iep_year === year);
    if (promotedMeta) {
      await supabase.from("student_ieps").update({ iep_year: null }).eq("id", promotedMeta.id);
    }

    setBusy(false);
    router.refresh();
  }

  async function handleNewIep() {
    const year = prompt("Enter new IEP year label (e.g., 2026-2027):");
    if (!year?.trim()) return;

    setBusy(true);

    for (const goal of currentGoals) {
      await supabase.from("goals").update({ archived: true, iep_year: year }).eq("id", goal.id);
    }

    await supabase.from("sessions")
      .update({ iep_year: year })
      .eq("student_id", studentId)
      .is("iep_year", null);

    // Move current IEP metadata to archived
    const currentMeta = getMeta(null);
    if (currentMeta) {
      await supabase.from("student_ieps").update({ iep_year: year }).eq("id", currentMeta.id);
    }

    // Create fresh current IEP metadata
    const today = new Date().toISOString().split("T")[0];
    const { data: newMeta } = await supabase.from("student_ieps").insert({
      student_id: studentId,
      iep_year: null,
      iep_date: today,
    }).select().single();

    if (newMeta) setIepMeta((prev) => [...prev.map((m) => m.id === currentMeta?.id ? { ...m, iep_year: year } : m), newMeta]);

    setBusy(false);
    router.refresh();
  }

  const inputClass = "px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900";

  // --- Render helpers ---

  function renderMetaSection(iepYear: string | null, yearLabel?: string) {
    const meta = getMeta(iepYear);
    const isEditing = editingMeta === (meta?.id || `new-${iepYear}`);

    if (isEditing) {
      return (
        <div className="px-5 py-3 bg-slate-50/80 flex flex-wrap items-end gap-3 border-b border-slate-100">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">IEP Date</label>
            <input type="date" value={metaForm.iep_date} onChange={(e) => setMetaForm({ ...metaForm, iep_date: e.target.value })}
              className={`${inputClass} text-[12px] py-1.5`} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Service Minutes</label>
            <input value={metaForm.service_minutes} onChange={(e) => setMetaForm({ ...metaForm, service_minutes: e.target.value })}
              placeholder="30 SI, 60 LI..." className={`${inputClass} text-[12px] py-1.5`} />
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => saveMetaEdit(meta?.id || "", iepYear)} disabled={busy}
              className="px-2.5 py-1.5 bg-teal-600 text-white rounded text-[11px] font-medium cursor-pointer disabled:opacity-50">Save</button>
            <button onClick={() => setEditingMeta(null)}
              className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-100 rounded text-[11px] font-medium cursor-pointer">Cancel</button>
          </div>
        </div>
      );
    }

    const hasData = meta?.iep_date || meta?.service_minutes;
    return (
      <div className="px-5 py-2.5 bg-slate-50/40 flex items-center gap-4 text-[12px] border-b border-slate-100">
        {meta?.iep_date && (
          <span className="text-slate-500">
            <span className="text-slate-400">IEP Date:</span>{" "}
            <span className="font-medium">{new Date(meta.iep_date + "T00:00:00").toLocaleDateString()}</span>
          </span>
        )}
        {meta?.service_minutes && (
          <span className="text-slate-500">
            <span className="text-slate-400">Service:</span>{" "}
            <span className="font-medium">{meta.service_minutes}</span>
          </span>
        )}
        <button
          onClick={() => {
            if (meta) {
              startEditMeta(meta);
            } else {
              setEditingMeta(`new-${iepYear}`);
              setMetaForm({ iep_date: "", service_minutes: "" });
            }
          }}
          className="text-[11px] text-teal-600 hover:text-teal-700 font-medium cursor-pointer ml-auto"
        >
          {hasData ? "Edit" : "+ Add IEP Details"}
        </button>
      </div>
    );
  }

  function renderGoalRow(goal: Goal, isCurrent: boolean) {
    const isEditing = editingGoal === goal.id;

    return (
      <div key={goal.id} className="px-5 py-3 group flex items-start gap-2">
        <span className={`text-[13px] font-medium mt-0.5 w-6 shrink-0 tabular-nums ${isCurrent ? "text-slate-700" : "text-slate-500"}`}>
          {goal.goal_number}.
        </span>
        {isEditing ? (
          <div className="flex-1 flex flex-col gap-2">
            <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3}
              className={`flex-1 ${inputClass}`} />
            <div className="flex gap-1.5">
              <button onClick={() => saveEditGoal(goal.id)} disabled={busy}
                className="px-2.5 py-1 bg-teal-600 text-white rounded text-[11px] font-medium cursor-pointer disabled:opacity-50">Save</button>
              <button onClick={() => setEditingGoal(null)}
                className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 rounded text-[11px] font-medium cursor-pointer">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <p className={`flex-1 text-[13px] ${isCurrent ? "text-slate-500" : "text-slate-400"}`}>{goal.description}</p>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={() => startEditGoal(goal)} title="Edit"
                className="p-1 text-slate-300 hover:text-teal-600 cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                </svg>
              </button>
              <button onClick={() => deleteGoal(goal.id, isCurrent)} title="Delete"
                className="p-1 text-slate-300 hover:text-red-500 cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  function renderAddGoalRow(iepYear: string | null, archived: boolean) {
    const key = iepYear ?? "__current__";
    if (addingTo === key) {
      return (
        <div className="px-5 py-3 flex items-start gap-2">
          <span className="text-[13px] text-emerald-500 mt-0.5 w-6 shrink-0">+</span>
          <div className="flex-1 flex flex-col gap-2">
            <textarea value={newGoalText} onChange={(e) => setNewGoalText(e.target.value)}
              placeholder="New goal description..." rows={2} autoFocus
              className="flex-1 px-3 py-2 bg-emerald-50/50 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400" />
            <div className="flex gap-1.5">
              <button onClick={() => addGoal(iepYear, archived)} disabled={busy || !newGoalText.trim()}
                className="px-2.5 py-1 bg-teal-600 text-white rounded text-[11px] font-medium cursor-pointer disabled:opacity-50">Add Goal</button>
              <button onClick={() => { setAddingTo(null); setNewGoalText(""); }}
                className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 rounded text-[11px] font-medium cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="px-5 py-2.5">
        <button onClick={() => { setAddingTo(key); setNewGoalText(""); }}
          className="text-[12px] text-teal-600 hover:text-teal-700 font-medium cursor-pointer">+ Add Goal</button>
      </div>
    );
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
          disabled={busy || currentGoals.length === 0}
          className="text-[12px] font-medium text-amber-600 hover:text-amber-700 border border-amber-200 hover:bg-amber-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          {busy ? "Working..." : "New IEP"}
        </button>
      </div>

      {tab === "current" ? (
        <>
          {renderMetaSection(null)}
          {currentGoals.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {currentGoals.map((goal) => renderGoalRow(goal, true))}
            </div>
          ) : (
            <p className="px-5 py-6 text-center text-slate-400 text-sm">No goals defined yet.</p>
          )}
          {renderAddGoalRow(null, false)}
        </>
      ) : (
        Object.keys(archivedByYear).length > 0 ? (
          <div className="divide-y divide-slate-200">
            {Object.entries(archivedByYear).map(([year, goals]) => (
              <div key={year}>
                <div className="px-5 py-3 bg-slate-50/50 flex items-center justify-between gap-3">
                  <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">IEP Year: {year}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => makeCurrent(year)}
                      disabled={busy}
                      className="text-[11px] font-medium text-teal-600 hover:text-teal-700 border border-teal-200 hover:bg-teal-50 px-2.5 py-1 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Make Current
                    </button>
                    <button
                      onClick={() => deleteIep(year)}
                      disabled={busy}
                      className="text-[11px] font-medium text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 px-2.5 py-1 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {renderMetaSection(year)}
                <div className="divide-y divide-slate-100">
                  {goals.map((goal) => renderGoalRow(goal, false))}
                </div>
                {renderAddGoalRow(year, true)}
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
