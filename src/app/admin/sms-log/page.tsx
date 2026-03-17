import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function SmsLogPage() {
  const supabase = await createServerSupabaseClient();

  // Fetch recent messages
  const { data: messages } = await supabase
    .from("sms_messages")
    .select("*, profile:profiles!user_id(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  // Compute stats
  const allMessages = messages || [];
  const totalMessages = allMessages.length;
  const aiParsed = allMessages.filter((m) => m.parse_method === "ai").length;
  const visionParsed = allMessages.filter((m) => m.parse_method === "vision").length;
  const regexFallback = allMessages.filter((m) => m.parse_method === "regex").length;
  const saved = allMessages.filter((m) => m.status === "saved").length;
  const failed = allMessages.filter((m) => m.status === "failed").length;
  const avgProcessingTime =
    allMessages.filter((m) => m.processing_time_ms).length > 0
      ? Math.round(
          allMessages
            .filter((m) => m.processing_time_ms)
            .reduce((sum, m) => sum + (m.processing_time_ms || 0), 0) /
            allMessages.filter((m) => m.processing_time_ms).length
        )
      : 0;

  const stats = [
    { label: "Total Messages", value: totalMessages },
    { label: "AI Parsed", value: aiParsed },
    { label: "Vision Parsed", value: visionParsed },
    { label: "Regex Fallback", value: regexFallback },
    { label: "Saved", value: saved },
    { label: "Failed", value: failed },
    { label: "Avg Processing", value: `${avgProcessingTime}ms` },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
          SMS Message Log
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Monitor inbound and outbound SMS messages, parsing stats, and system
          health.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4"
          >
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {stat.label}
            </p>
            <p className="text-xl font-semibold text-slate-900 mt-1">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Messages Table */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  From
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Time (ms)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allMessages.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    No SMS messages yet. Messages will appear here once the
                    Twilio webhook is configured.
                  </td>
                </tr>
              ) : (
                allMessages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                      {new Date(msg.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {msg.profile?.name || msg.from_number}
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-[300px] truncate">
                      {msg.body || (msg.media_url ? "[Image]" : "—")}
                    </td>
                    <td className="px-4 py-3">
                      {msg.parse_method && (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            msg.parse_method === "ai"
                              ? "bg-purple-50 text-purple-700"
                              : msg.parse_method === "vision"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {msg.parse_method}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          msg.status === "saved"
                            ? "bg-emerald-50 text-emerald-700"
                            : msg.status === "failed"
                              ? "bg-red-50 text-red-700"
                              : msg.status === "parsed"
                                ? "bg-cyan-50 text-cyan-700"
                                : "bg-slate-50 text-slate-600"
                        }`}
                      >
                        {msg.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {msg.processing_time_ms || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
