"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import type { Profile, School } from "@/lib/supabase/types";

export default function HoursPage() {
  const supabase = createClient();

  const [hours, setHours] = useState<Record<string, unknown>[]>([]);
  const [staff, setStaff] = useState<Profile[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [filters, setFilters] = useState({ staff_id: "", school_id: "", date_from: "", date_to: "" });
  const [totalHours, setTotalHours] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const admin = profile?.role === "admin";
      setIsAdmin(admin);

      if (admin) {
        const { data } = await supabase.from("profiles").select("*").order("name");
        if (data) setStaff(data);
      }

      const { data: sc } = await supabase.from("schools").select("*").order("name");
      if (sc) setSchools(sc);

      setReady(true);
    }
    init();
  }, []);

  useEffect(() => {
    if (ready) loadHours();
  }, [filters, ready]);

  async function loadHours() {
    let query = supabase
      .from("hours")
      .select("*, profile:profiles!user_id(name), school:schools(name)")
      .order("date", { ascending: false })
      .limit(100);

    if (filters.staff_id) query = query.eq("user_id", filters.staff_id);
    if (filters.school_id) query = query.eq("school_id", filters.school_id);
    if (filters.date_from) query = query.gte("date", filters.date_from);
    if (filters.date_to) query = query.lte("date", filters.date_to);

    const { data } = await query;
    if (data) {
      setHours(data);
      setTotalHours(data.reduce((sum, h) => sum + Number(h.hours), 0));
    }
  }

  const filterClass = "px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all cursor-pointer";

  if (!ready) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Hours</h1>
        <Link href="/admin/hours/new"
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer">
          Log Hours
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {isAdmin && (
          <select value={filters.staff_id} onChange={(e) => setFilters({ ...filters, staff_id: e.target.value })} className={filterClass}>
            <option value="">All Staff</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <select value={filters.school_id} onChange={(e) => setFilters({ ...filters, school_id: e.target.value })} className={filterClass}>
          <option value="">All Schools</option>
          {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
          className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all" />
        <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
          className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all" />
        <div className="ml-auto bg-teal-50 px-4 py-2.5 rounded-lg border border-teal-100">
          <span className="text-[13px] text-teal-700 font-semibold tabular-nums">Total: {totalHours.toFixed(1)} hrs</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        {hours.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-200 text-left bg-slate-50/50">
                  <th className="px-5 py-3 text-slate-500 font-medium">Date</th>
                  {isAdmin && <th className="px-5 py-3 text-slate-500 font-medium">Staff</th>}
                  <th className="px-5 py-3 text-slate-500 font-medium">School</th>
                  <th className="px-5 py-3 text-slate-500 font-medium">Hours</th>
                  <th className="px-5 py-3 text-slate-500 font-medium">Description</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hours.map((h) => (
                  <tr key={h.id as string} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 text-slate-900 tabular-nums">{new Date(h.date as string).toLocaleDateString()}</td>
                    {isAdmin && <td className="px-5 py-3 text-slate-600">{(h.profile as Record<string, unknown>)?.name as string}</td>}
                    <td className="px-5 py-3 text-slate-600">{(h.school as Record<string, unknown>)?.name as string}</td>
                    <td className="px-5 py-3 text-slate-900 font-semibold tabular-nums">{Number(h.hours).toFixed(1)}</td>
                    <td className="px-5 py-3 text-slate-400">{(h.description as string) || "\u2014"}</td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/hours/${h.id}/edit`} className="text-teal-600 hover:text-teal-700 font-medium transition-colors">Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-slate-400 text-sm">No hours logged yet.</p>
        )}
      </div>
    </div>
  );
}
