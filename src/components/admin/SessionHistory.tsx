"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface SessionGoalData {
  id: string;
  goal_id: string;
  correct_count: number;
  total_count: number;
  percentage: number;
  target: string | null;
  performance_level: string | null;
  notes: string | null;
  goal: { goal_number: number; description: string } | null;
}

interface SessionData {
  id: string;
  student_id: string;
  date: string;
  notes: string | null;
  entered_by_profile: { name: string } | null;
  session_goals: SessionGoalData[];
}

interface Props {
  sessions: SessionData[];
  studentId: string;
}

export default function SessionHistory({ sessions: initialSessions, studentId }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ date: "", notes: "" });

  async function handleDelete(sessionId: string) {
    if (!confirm("Delete this session? This cannot be undone.")) return;
    await supabase.from("sessions").delete().eq("id", sessionId);
    setSessions(sessions.filter((s) => s.id !== sessionId));
  }

  function startEdit(session: SessionData) {
    setEditingId(session.id);
    setEditForm({ date: session.date, notes: session.notes || "" });
  }

  async function saveEdit(sessionId: string) {
    await supabase.from("sessions").update({
      date: editForm.date,
      notes: editForm.notes || null,
    }).eq("id", sessionId);
    setSessions(sessions.map((s) =>
      s.id === sessionId ? { ...s, date: editForm.date, notes: editForm.notes || null } : s
    ));
    setEditingId(null);
  }

  const inputClass = "px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900";

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900 text-[15px]">Session History</h2>
      </div>
      {sessions.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {sessions.map((session) => (
            <div key={session.id} className="px-5 py-4">
              {editingId === session.id ? (
                <div className="space-y-3">
                  <div className="flex gap-3 items-end">
                    <div>
                      <label className="block text-[12px] font-medium text-slate-500 mb-1">Date</label>
                      <input type="date" value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[12px] font-medium text-slate-500 mb-1">Notes</label>
                      <input value={editForm.notes}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        className={`w-full ${inputClass}`}
                        placeholder="Session notes..." />
                    </div>
                    <button onClick={() => saveEdit(session.id)}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[12px] font-medium transition-colors cursor-pointer">
                      Save
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg text-[12px] font-medium transition-colors cursor-pointer">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[13px] font-medium text-slate-900">
                      {new Date(session.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-slate-400">
                        {session.entered_by_profile?.name && `by ${session.entered_by_profile.name}`}
                      </p>
                      <button onClick={() => startEdit(session)}
                        className="text-slate-300 hover:text-teal-600 transition-colors cursor-pointer p-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(session.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer p-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {session.session_goals?.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {session.session_goals.map((sg) => (
                        <div key={sg.id} className="bg-slate-50 rounded-lg px-3 py-2 text-[13px]">
                          <p className="text-slate-600">
                            Goal {sg.goal?.goal_number}
                            {sg.target && <span className="text-slate-400"> — {sg.target}</span>}
                            {sg.total_count > 0 && (
                              <span className="font-semibold text-slate-900">
                                {" "}{sg.correct_count}/{sg.total_count} ({sg.percentage}%)
                              </span>
                            )}
                          </p>
                          {sg.performance_level && (
                            <p className="text-xs text-teal-600 mt-0.5">{sg.performance_level}</p>
                          )}
                          {sg.notes && (
                            <p className="text-xs text-slate-400 mt-0.5">{sg.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {session.notes && (
                    <p className="text-xs text-slate-400 mt-2">{session.notes}</p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="px-5 py-10 text-center text-slate-400 text-sm">
          No sessions recorded yet. Log the first session above.
        </p>
      )}
    </div>
  );
}
