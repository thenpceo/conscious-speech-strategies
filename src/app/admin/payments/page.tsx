"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
  profile: { name: string; rate_per_hour: number | null } | null;
}

export default function PaymentsPage() {
  const supabase = createClient();
  const [timesheets, setTimesheets] = useState<TimesheetRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: ts } = await supabase
      .from("timesheets")
      .select("*, profile:profiles!user_id(name, rate_per_hour)")
      .order("created_at", { ascending: false });
    if (ts) setTimesheets(ts as unknown as TimesheetRow[]);
    setLoading(false);
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

      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        {timesheets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-200 text-left bg-slate-50/50">
                  <th className="px-5 py-3 text-slate-500 font-medium">Staff</th>
                  <th className="px-5 py-3 text-slate-500 font-medium">Period</th>
                  <th className="px-5 py-3 text-slate-500 font-medium">Hours</th>
                  <th className="px-5 py-3 text-slate-500 font-medium">Status</th>
                  <th className="px-5 py-3 text-slate-500 font-medium">Submitted</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {timesheets.map((ts) => {
                  const rate = ts.profile?.rate_per_hour || 0;
                  const pay = ts.total_hours * rate;
                  return (
                    <tr key={ts.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 text-slate-900 font-medium">{ts.profile?.name || "Unknown"}</td>
                      <td className="px-5 py-3 text-slate-600 tabular-nums">
                        {new Date(ts.period_start + "T00:00:00").toLocaleDateString()} &mdash; {new Date(ts.period_end + "T00:00:00").toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-slate-900 font-semibold tabular-nums">
                        {ts.total_hours.toFixed(1)} hrs
                        {rate > 0 && <span className="text-slate-400 font-normal ml-1">(${pay.toFixed(2)})</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${statusColors[ts.status] || ""}`}>
                          {ts.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-400 tabular-nums">
                        {ts.submitted_at ? new Date(ts.submitted_at).toLocaleDateString() : "\u2014"}
                      </td>
                      <td className="px-5 py-3">
                        {ts.status === "submitted" && (
                          <div className="flex gap-2">
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-slate-400 text-sm">
            No timesheets submitted yet.
          </p>
        )}
      </div>
    </div>
  );
}
