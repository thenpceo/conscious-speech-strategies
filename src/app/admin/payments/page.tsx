"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface HourEntry {
  id: string;
  date: string;
  hours: number;
  description: string | null;
  category: string | null;
  time_in: string | null;
  time_out: string | null;
  school: { name: string } | null;
}

interface TimesheetRow {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  status: string;
  total_hours: number;
  submitted_at: string | null;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
  profile: { name: string; rate_per_hour: number | null; internal_rate: number | null } | null;
  timesheet_hours: { hours: HourEntry }[];
}

export default function PaymentsPage() {
  const supabase = createClient();
  const [timesheets, setTimesheets] = useState<TimesheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: ts } = await supabase
      .from("timesheets")
      .select("*, profile:profiles!user_id(name, rate_per_hour, internal_rate), timesheet_hours(hours:hours!hours_id(id, date, hours, description, category, time_in, time_out, school:schools(name)))")
      .order("created_at", { ascending: false });
    if (ts) setTimesheets(ts as unknown as TimesheetRow[]);
    setLoading(false);
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function updateStatus(id: string, status: "approved" | "rejected") {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("timesheets").update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id,
    }).eq("id", id);
    if (error) {
      alert("Error updating timesheet: " + error.message);
      return;
    }
    loadData();
  }

  const statusColors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    submitted: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-600",
  };

  if (loading) return null;

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 tracking-tight mb-6">Payments & Timesheets</h1>

      <div className="space-y-4">
        {timesheets.length > 0 ? (
          timesheets.map((ts) => {
            const isOpen = expanded.has(ts.id);
            const internalRate = ts.profile?.internal_rate ?? ts.profile?.rate_per_hour ?? 0;
            const totalPay = ts.total_hours * internalRate;
            const hourEntries = (ts.timesheet_hours || [])
              .map((th) => th.hours)
              .filter(Boolean)
              .sort((a, b) => a.date.localeCompare(b.date));

            return (
              <div key={ts.id} className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
                {/* Header row — clickable to expand */}
                <button
                  onClick={() => toggleExpand(ts.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
                  <svg
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>

                  <div className="flex-1 flex flex-wrap items-center gap-x-6 gap-y-1 text-[13px]">
                    <span className="text-slate-900 font-semibold">{ts.profile?.name || "Unknown"}</span>
                    <span className="text-slate-500 tabular-nums">
                      {new Date(ts.period_start + "T00:00:00").toLocaleDateString()} &mdash; {new Date(ts.period_end + "T00:00:00").toLocaleDateString()}
                    </span>
                    <span className="text-slate-900 font-semibold tabular-nums">{ts.total_hours.toFixed(1)} hrs</span>
                    {internalRate > 0 && (
                      <span className="text-teal-700 font-semibold tabular-nums">${totalPay.toFixed(2)}</span>
                    )}
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${statusColors[ts.status] || ""}`}>
                      {ts.status}
                    </span>
                  </div>

                  {ts.status === "submitted" && (
                    <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => updateStatus(ts.id, "approved")}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium transition-colors cursor-pointer">
                        Approve
                      </button>
                      <button onClick={() => updateStatus(ts.id, "rejected")}
                        className="px-2.5 py-1 text-red-600 hover:bg-red-50 border border-red-200 rounded text-[11px] font-medium transition-colors cursor-pointer">
                        Reject
                      </button>
                    </div>
                  )}
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-slate-100">
                    {hourEntries.length > 0 ? (
                      <table className="w-full text-[13px]">
                        <thead>
                          <tr className="border-b border-slate-100 text-left bg-slate-50/30">
                            <th className="px-5 py-2.5 pl-14 text-slate-400 font-medium">Date</th>
                            <th className="px-5 py-2.5 text-slate-400 font-medium">School</th>
                            <th className="px-5 py-2.5 text-slate-400 font-medium">Time</th>
                            <th className="px-5 py-2.5 text-slate-400 font-medium">Hours</th>
                            <th className="px-5 py-2.5 text-slate-400 font-medium">Category</th>
                            <th className="px-5 py-2.5 text-slate-400 font-medium">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {hourEntries.map((h) => (
                            <tr key={h.id} className="hover:bg-slate-50/30 transition-colors">
                              <td className="px-5 py-2.5 pl-14 text-slate-700 tabular-nums">
                                {new Date(h.date + "T00:00:00").toLocaleDateString()}
                              </td>
                              <td className="px-5 py-2.5 text-slate-500">{h.school?.name || "\u2014"}</td>
                              <td className="px-5 py-2.5 text-slate-500 tabular-nums">
                                {h.time_in && h.time_out ? `${h.time_in} \u2013 ${h.time_out}` : "\u2014"}
                              </td>
                              <td className="px-5 py-2.5 text-slate-900 font-semibold tabular-nums">{Number(h.hours).toFixed(1)}</td>
                              <td className="px-5 py-2.5 text-slate-400">{h.category || "\u2014"}</td>
                              <td className="px-5 py-2.5 text-slate-500 max-w-xs truncate">{h.description || "\u2014"}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-slate-200 bg-slate-50/50">
                            <td colSpan={3} className="px-5 py-3 pl-14 text-right text-slate-500 font-medium text-[12px] uppercase tracking-wide">Totals</td>
                            <td className="px-5 py-3 text-slate-900 font-bold tabular-nums">{ts.total_hours.toFixed(1)} hrs</td>
                            <td></td>
                            <td className="px-5 py-3 text-teal-700 font-bold tabular-nums">
                              {internalRate > 0 ? `$${totalPay.toFixed(2)}` : "\u2014"}
                              {internalRate > 0 && (
                                <span className="text-slate-400 font-normal ml-1 text-[11px]">@ ${internalRate}/hr</span>
                              )}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    ) : (
                      <p className="px-5 py-6 pl-14 text-slate-400 text-sm">No individual hours linked to this timesheet.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm">
            <p className="px-5 py-10 text-center text-slate-400 text-sm">
              No timesheets submitted yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
