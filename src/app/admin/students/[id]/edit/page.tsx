"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import type { School, Goal } from "@/lib/supabase/types";

export default function EditStudentPage() {
  const supabase = createClient();
  const router = useRouter();
  const { id: studentId } = useParams<{ id: string }>();
  const [schools, setSchools] = useState<School[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", school_id: "", iep_date: "", notes: "" });
  const [existingGoals, setExistingGoals] = useState<Goal[]>([]);
  const [newGoals, setNewGoals] = useState<{ description: string }[]>([]);

  useEffect(() => {
    loadData();
  }, [studentId]);

  async function loadData() {
    const [{ data: student }, { data: goalsData }, { data: schoolsData }] = await Promise.all([
      supabase.from("students").select("*").eq("id", studentId).single(),
      supabase.from("goals").select("*").eq("student_id", studentId).eq("archived", false).order("goal_number"),
      supabase.from("schools").select("*").order("name"),
    ]);
    if (student) {
      setForm({
        name: student.name,
        school_id: student.school_id,
        iep_date: student.iep_date || "",
        notes: student.notes || "",
      });
    }
    if (goalsData) setExistingGoals(goalsData);
    if (schoolsData) setSchools(schoolsData);
  }

  function updateExistingGoal(id: string, desc: string) {
    setExistingGoals((prev) => prev.map((g) => (g.id === id ? { ...g, description: desc } : g)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    await supabase.from("students").update({
      name: form.name,
      school_id: form.school_id,
      iep_date: form.iep_date || null,
      notes: form.notes || null,
    }).eq("id", studentId);

    // Update existing goals
    for (const goal of existingGoals) {
      await supabase.from("goals").update({ description: goal.description }).eq("id", goal.id);
    }

    // Insert new goals
    const validNew = newGoals.filter((g) => g.description.trim());
    if (validNew.length > 0) {
      const nextNum = (existingGoals.length > 0 ? Math.max(...existingGoals.map((g) => g.goal_number)) : 0) + 1;
      await supabase.from("goals").insert(
        validNew.map((g, i) => ({
          student_id: studentId,
          goal_number: nextNum + i,
          description: g.description.trim(),
        }))
      );
    }

    router.push(`/admin/students/${studentId}`);
  }

  async function archiveGoal(goalId: string) {
    await supabase.from("goals").update({ archived: true }).eq("id", goalId);
    setExistingGoals((prev) => prev.filter((g) => g.id !== goalId));
  }

  const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400";

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900 tracking-tight mb-6">Edit Student</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-slate-900 text-[15px]">Student Info</h2>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">School *</label>
            <select required value={form.school_id} onChange={(e) => setForm({ ...form, school_id: e.target.value })}
              className={`${inputClass} cursor-pointer`}>
              <option value="">Select a school...</option>
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">IEP Date</label>
            <input type="date" value={form.iep_date} onChange={(e) => setForm({ ...form, iep_date: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className={inputClass} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-[15px]">IEP Goals</h2>
            <button type="button" onClick={() => setNewGoals([...newGoals, { description: "" }])}
              className="text-[13px] text-teal-600 hover:text-teal-700 font-medium cursor-pointer">+ Add Goal</button>
          </div>

          {existingGoals.map((goal) => (
            <div key={goal.id} className="flex gap-2">
              <span className="text-[13px] text-slate-400 mt-3 w-6 shrink-0 tabular-nums">#{goal.goal_number}</span>
              <textarea value={goal.description} onChange={(e) => updateExistingGoal(goal.id, e.target.value)} rows={2}
                className={`flex-1 ${inputClass}`} />
              <button type="button" onClick={() => archiveGoal(goal.id)}
                className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer px-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {newGoals.map((goal, i) => (
            <div key={`new-${i}`} className="flex gap-2">
              <span className="text-[13px] text-emerald-500 mt-3 w-6 shrink-0">+</span>
              <textarea value={goal.description}
                onChange={(e) => { const u = [...newGoals]; u[i].description = e.target.value; setNewGoals(u); }}
                placeholder="New goal description..." rows={2}
                className="flex-1 px-3.5 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400" />
              <button type="button"
                onClick={() => setNewGoals(newGoals.filter((_, j) => j !== i))}
                className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer px-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium text-[13px] transition-colors disabled:opacity-50 cursor-pointer">
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2.5 rounded-lg font-medium text-[13px] text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">Cancel</button>
        </div>
      </form>
    </div>
  );
}
