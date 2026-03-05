"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, School } from "@/lib/supabase/types";

export default function SessionsPage() {
  const supabase = createClient();
  const [sessions, setSessions] = useState<Record<string, unknown>[]>([]);
  const [staff, setStaff] = useState<Profile[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [filters, setFilters] = useState({ staff_id: "", school_id: "", date_from: "", date_to: "" });

  useEffect(() => {
    loadFilters();
    loadSessions();
  }, []);

  async function loadFilters() {
    const [{ data: s }, { data: sc }] = await Promise.all([
      supabase.from("profiles").select("*").order("name"),
      supabase.from("schools").select("*").order("name"),
    ]);
    if (s) setStaff(s);
    if (sc) setSchools(sc);
  }

  async function loadSessions() {
    let query = supabase
      .from("sessions")
      .select("*, student:students(name, school_id, school:schools(name)), entered_by_profile:profiles!entered_by(name), session_goals(correct_count, total_count, goal:goals(goal_number))")
      .order("date", { ascending: false })
      .limit(50);

    if (filters.date_from) query = query.gte("date", filters.date_from);
    if (filters.date_to) query = query.lte("date", filters.date_to);
    if (filters.staff_id) query = query.eq("entered_by", filters.staff_id);

    const { data } = await query;
    let filtered = data || [];
    if (filters.school_id) {
      filtered = filtered.filter((s: Record<string, unknown>) =>
        (s.student as Record<string, unknown>)?.school_id === filters.school_id
      );
    }
    setSessions(filtered);
  }

  useEffect(() => {
    loadSessions();
  }, [filters]);

  const filterClass = "px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all cursor-pointer";

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 tracking-tight mb-6">All Sessions</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filters.staff_id} onChange={(e) => setFilters({ ...filters, staff_id: e.target.value })} className={filterClass}>
          <option value="">All Staff</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filters.school_id} onChange={(e) => setFilters({ ...filters, school_id: e.target.value })} className={filterClass}>
          <option value="">All Schools</option>
          {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
          className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all" />
        <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
          className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm">
        {sessions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {sessions.map((session) => (
              <a key={session.id as string} href={`/admin/students/${session.student_id}`}
                className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors block cursor-pointer">
                <div>
                  <p className="font-medium text-slate-900 text-[14px]">{(session.student as Record<string, unknown>)?.name as string}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {((session.student as Record<string, unknown>)?.school as Record<string, unknown>)?.name as string}
                    {" · by "}
                    {(session.entered_by_profile as Record<string, unknown>)?.name as string}
                  </p>
                  {(session.session_goals as Record<string, unknown>[])?.length > 0 && (
                    <p className="text-xs text-slate-400 mt-1 tabular-nums">
                      {(session.session_goals as Record<string, unknown>[]).map((sg) =>
                        `G${(sg.goal as Record<string, unknown>)?.goal_number}: ${sg.correct_count}/${sg.total_count}`
                      ).join(" · ")}
                    </p>
                  )}
                </div>
                <span className="text-[13px] text-slate-400 tabular-nums shrink-0 ml-4">
                  {new Date(session.date as string).toLocaleDateString()}
                </span>
              </a>
            ))}
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-slate-400 text-sm">No sessions found.</p>
        )}
      </div>
    </div>
  );
}
