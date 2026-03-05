import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createServerSupabaseClient();

  const [
    { count: studentCount },
    { count: schoolCount },
    { count: sessionCount },
    { data: recentSessions },
    { data: profile },
  ] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: true }).eq("archived", false),
    supabase.from("schools").select("*", { count: "exact", head: true }),
    supabase.from("sessions").select("*", { count: "exact", head: true }),
    supabase
      .from("sessions")
      .select("*, student:students(name, school:schools(name)), entered_by_profile:profiles!entered_by(name)")
      .order("date", { ascending: false })
      .limit(5),
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return { data: null };
      return supabase.from("profiles").select("*").eq("id", user.id).single();
    }),
  ]);

  const stats = [
    {
      label: "Active Students",
      value: studentCount ?? 0,
      href: "/admin/students",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
        </svg>
      ),
      color: "from-teal-500 to-cyan-500",
    },
    {
      label: "Schools",
      value: schoolCount ?? 0,
      href: "/admin/schools",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
        </svg>
      ),
      color: "from-cyan-500 to-blue-500",
    },
    {
      label: "Total Sessions",
      value: sessionCount ?? 0,
      href: "/admin/sessions",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
        </svg>
      ),
      color: "from-violet-500 to-purple-500",
    },
  ];

  const quickActions = [
    { label: "Add Student", href: "/admin/students/new", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" /></svg> },
    { label: "Log Session", href: "/admin/students", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> },
    { label: "Log Hours", href: "/admin/hours/new", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg> },
    { label: "Export Report", href: "/admin/export", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg> },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
          Welcome back{profile?.data?.name ? `, ${profile.data.name}` : ""}
        </h1>
        <p className="text-slate-400 text-sm mt-1">Here&apos;s what&apos;s happening with your practice.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-xl border border-slate-200/60 p-5 hover:shadow-md hover:border-slate-300/60 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-medium text-slate-500">{stat.label}</p>
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-sm opacity-80 group-hover:opacity-100 transition-opacity`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="bg-teal-600 hover:bg-teal-700 text-white text-center py-3 rounded-lg font-medium text-[13px] transition-colors duration-150 cursor-pointer flex items-center justify-center gap-2 shadow-sm shadow-teal-600/10"
          >
            {action.icon}
            {action.label}
          </Link>
        ))}
      </div>

      {/* Recent Sessions */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 text-[15px]">Recent Sessions</h2>
          <Link href="/admin/sessions" className="text-[13px] text-teal-600 hover:text-teal-700 font-medium cursor-pointer">
            View all
          </Link>
        </div>
        {recentSessions && recentSessions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentSessions.map((session: Record<string, unknown>) => (
              <div key={session.id as string} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium text-slate-900">
                    {(session.student as Record<string, unknown>)?.name as string}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {((session.student as Record<string, unknown>)?.school as Record<string, unknown>)?.name as string}
                    {" · "}
                    {(session.entered_by_profile as Record<string, unknown>)?.name as string}
                  </p>
                </div>
                <span className="text-xs text-slate-400 tabular-nums">
                  {new Date(session.date as string).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-slate-400 text-sm">
            No sessions yet. Start by adding a student and logging a session.
          </p>
        )}
      </div>
    </div>
  );
}
