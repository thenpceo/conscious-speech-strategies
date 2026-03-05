import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import InvoiceActions from "./InvoiceActions";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, school:schools(name, address, contact_name, contact_email)")
    .eq("id", id)
    .single();

  if (!invoice) notFound();

  const { data: lines } = await supabase
    .from("invoice_lines")
    .select("*, profile:profiles!user_id(name)")
    .eq("invoice_id", id)
    .order("date");

  const statusColors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    sent: "bg-sky-50 text-sky-700 border border-sky-200",
    paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  };

  return (
    <div className="max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Invoice</h1>
          <p className="text-slate-500 text-sm mt-1">
            {(invoice.school as Record<string, unknown>)?.name as string}
            {" \u00b7 "}
            {new Date(invoice.period_start).toLocaleDateString()} — {new Date(invoice.period_end).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[invoice.status] || ""}`}>
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </span>
          <InvoiceActions invoiceId={id} currentStatus={invoice.status} />
        </div>
      </div>

      {/* Invoice Header */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1.5">From</p>
            <p className="font-semibold text-slate-900 text-[14px]">Conscious Speech Strategies</p>
            <p className="text-sm text-slate-500">Rachel Dee, SLP</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1.5">Bill To</p>
            <p className="font-semibold text-slate-900 text-[14px]">{(invoice.school as Record<string, unknown>)?.name as string}</p>
            {String((invoice.school as Record<string, unknown>)?.contact_name || "") && (
              <p className="text-sm text-slate-500">{String((invoice.school as Record<string, unknown>)?.contact_name || "")}</p>
            )}
            {String((invoice.school as Record<string, unknown>)?.address || "") && (
              <p className="text-sm text-slate-500">{String((invoice.school as Record<string, unknown>)?.address || "")}</p>
            )}
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 text-left bg-slate-50/50">
                <th className="px-5 py-3 text-slate-500 font-medium">Date</th>
                <th className="px-5 py-3 text-slate-500 font-medium">Staff</th>
                <th className="px-5 py-3 text-slate-500 font-medium">Hours</th>
                <th className="px-5 py-3 text-slate-500 font-medium">Rate</th>
                <th className="px-5 py-3 text-slate-500 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(lines || []).map((line: Record<string, unknown>) => (
                <tr key={line.id as string} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 text-slate-900 tabular-nums">{new Date(line.date as string).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-slate-600">{(line.profile as Record<string, unknown>)?.name as string || "\u2014"}</td>
                  <td className="px-5 py-3 text-slate-900 tabular-nums">{Number(line.hours).toFixed(1)}</td>
                  <td className="px-5 py-3 text-slate-600 tabular-nums">${Number(line.rate).toFixed(2)}/hr</td>
                  <td className="px-5 py-3 text-slate-900 font-semibold text-right tabular-nums">${Number(line.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50/30">
                <td colSpan={4} className="px-5 py-4 text-right font-semibold text-slate-900">Total Due:</td>
                <td className="px-5 py-4 font-bold text-slate-900 text-lg text-right tabular-nums">
                  ${Number(invoice.total_amount).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
