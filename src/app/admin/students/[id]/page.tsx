import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: student } = await supabase
    .from("students")
    .select("*, school:schools(name)")
    .eq("id", id)
    .single();

  if (!student) notFound();

  const [{ data: goals }, { data: sessions }] = await Promise.all([
    supabase
      .from("goals")
      .select("*")
      .eq("student_id", id)
      .eq("archived", false)
      .order("goal_number"),
    supabase
      .from("sessions")
      .select("*, entered_by_profile:profiles!entered_by(name), session_goals(*, goal:goals(goal_number, description))")
      .eq("student_id", id)
      .order("date", { ascending: false })
      .limit(20),
  ]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/students" className="text-[13px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
              Students
            </Link>
            <span className="text-slate-300">/</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{student.name}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {(student.school as Record<string, unknown>)?.name as string}
            {student.grade && ` · Grade ${student.grade}`}
            {student.eligibility && ` · ${student.eligibility}`}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href={`/admin/students/${id}/session`}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
          >
            Log Session
          </Link>
          <Link
            href={`/admin/students/${id}/edit`}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
          >
            Edit
          </Link>
        </div>
      </div>

      {/* Student Details */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm mb-6">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 text-[15px]">Student Details</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 px-5 py-4 text-[13px]">
          {[
            ["Student #", student.student_number],
            ["Grade", student.grade],
            ["Teacher", student.teacher],
            ["Eligibility", student.eligibility],
            ["Service Minutes", student.service_minutes],
            ["DOB", student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : null],
            ["IEP Date", student.iep_date ? new Date(student.iep_date).toLocaleDateString() : null],
            ["Re-Eval Date", student.iep_re_eval_date ? new Date(student.iep_re_eval_date).toLocaleDateString() : null],
            ["Parent Phone", student.parent_phone],
            ["Parent Phone 2", student.parent_phone_2],
            ["Parent Email", student.parent_email],
            ["Notes", student.notes],
          ].filter(([, val]) => val).map(([label, val]) => (
            <div key={label as string}>
              <span className="text-slate-400">{label as string}: </span>
              <span className="text-slate-700 font-medium">{val as string}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Goals */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm mb-6">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 text-[15px]">IEP Goals</h2>
        </div>
        {goals && goals.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {goals.map((goal: Record<string, unknown>) => (
              <div key={goal.id as string} className="px-5 py-3.5">
                <p className="text-[13px]">
                  <span className="font-medium text-slate-700">Goal {goal.goal_number as number}:</span>{" "}
                  <span className="text-slate-500">{goal.description as string}</span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-8 text-center text-slate-400 text-sm">No goals defined yet.</p>
        )}
      </div>

      {/* Session History */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 text-[15px]">Session History</h2>
        </div>
        {sessions && sessions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {sessions.map((session: Record<string, unknown>) => (
              <div key={session.id as string} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[13px] font-medium text-slate-900">
                    {new Date(session.date as string).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-slate-400">
                    by {(session.entered_by_profile as Record<string, unknown>)?.name as string}
                  </p>
                </div>
                {(session.session_goals as Record<string, unknown>[])?.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(session.session_goals as Record<string, unknown>[]).map(
                      (sg: Record<string, unknown>) => (
                        <div
                          key={sg.id as string}
                          className="bg-slate-50 rounded-lg px-3 py-2 text-[13px]"
                        >
                          <p className="text-slate-600">
                            Goal {(sg.goal as Record<string, unknown>)?.goal_number as number}
                            {String(sg.target || "") && <span className="text-slate-400"> — {String(sg.target)}</span>}
                            {(sg.total_count as number) > 0 && (
                              <span className="font-semibold text-slate-900">
                                {" "}{sg.correct_count as number}/{sg.total_count as number} ({sg.percentage as number}%)
                              </span>
                            )}
                          </p>
                          {String(sg.performance_level || "") && (
                            <p className="text-xs text-teal-600 mt-0.5">{String(sg.performance_level)}</p>
                          )}
                          {String(sg.notes || "") && (
                            <p className="text-xs text-slate-400 mt-0.5">{String(sg.notes)}</p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
                {String(session.notes || "") && (
                  <p className="text-xs text-slate-400 mt-2">{String(session.notes)}</p>
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
    </div>
  );
}
