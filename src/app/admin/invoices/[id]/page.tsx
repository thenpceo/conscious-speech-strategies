import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
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

  const totalHours = (lines || []).reduce((sum: number, l: Record<string, unknown>) => sum + Number(l.hours), 0);

  const periodStart = new Date(invoice.period_start).toLocaleDateString("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" });
  const periodEnd = new Date(invoice.period_end).toLocaleDateString("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" });
  const invoiceDate = new Date(invoice.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="max-w-3xl">
      {/* Admin toolbar - hidden on print */}
      <div className="no-print flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Invoice</h1>
          <p className="text-slate-500 text-sm mt-1">
            {(invoice.school as Record<string, unknown>)?.name as string}
            {" \u00b7 "}
            {periodStart} — {periodEnd}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[invoice.status] || ""}`}>
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </span>
          <InvoiceActions invoiceId={id} currentStatus={invoice.status} />
        </div>
      </div>

      {/* Printable invoice */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm print:shadow-none print:border-0 print:rounded-none">

        {/* Invoice Header with Logo */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-100 print:border-sage/30">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/Logo.png"
                alt="Conscious Speech Strategies"
                width={64}
                height={64}
                className="rounded-lg"
              />
              <div>
                <h2 className="text-xl font-semibold text-charcoal tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
                  Conscious Speech Strategies
                </h2>
                <p className="text-sm text-charcoal-light/70 mt-0.5">Rachel Dee, M.S., CCC-SLP</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-charcoal tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
                Invoice
              </p>
              <p className="text-xs text-slate-400 mt-1 tabular-nums">{invoiceDate}</p>
            </div>
          </div>
        </div>

        {/* Period & Bill To */}
        <div className="px-8 py-6 grid grid-cols-2 gap-8 border-b border-slate-100 print:border-sage/30">
          <div>
            <p className="text-[10px] text-sage-dark uppercase tracking-widest font-semibold mb-2">Bill To</p>
            <p className="font-semibold text-charcoal text-[15px]">{(invoice.school as Record<string, unknown>)?.name as string}</p>
            {String((invoice.school as Record<string, unknown>)?.contact_name || "") && (
              <p className="text-sm text-charcoal-light/70 mt-0.5">{String((invoice.school as Record<string, unknown>)?.contact_name || "")}</p>
            )}
            {String((invoice.school as Record<string, unknown>)?.address || "") && (
              <p className="text-sm text-charcoal-light/70 mt-0.5">{String((invoice.school as Record<string, unknown>)?.address || "")}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] text-sage-dark uppercase tracking-widest font-semibold mb-2">Service Period</p>
            <p className="text-sm text-charcoal tabular-nums">{periodStart}</p>
            <p className="text-sm text-charcoal tabular-nums">through {periodEnd}</p>
          </div>
        </div>

        {/* Line Items */}
        <div className="px-8 py-6">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b-2 border-sage/30 text-left">
                <th className="pb-3 text-[10px] text-sage-dark uppercase tracking-widest font-semibold">Date</th>
                <th className="pb-3 text-[10px] text-sage-dark uppercase tracking-widest font-semibold">Staff</th>
                <th className="pb-3 text-[10px] text-sage-dark uppercase tracking-widest font-semibold">Hours</th>
                <th className="pb-3 text-[10px] text-sage-dark uppercase tracking-widest font-semibold">Rate</th>
                <th className="pb-3 text-[10px] text-sage-dark uppercase tracking-widest font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(lines || []).map((line: Record<string, unknown>, i: number) => (
                <tr key={line.id as string} className={i % 2 === 0 ? "bg-cream/30 print:bg-cream/40" : ""}>
                  <td className="px-0 py-2.5 text-charcoal tabular-nums">
                    {new Date(line.date as string).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric" })}
                  </td>
                  <td className="px-0 py-2.5 text-charcoal-light">{(line.profile as Record<string, unknown>)?.name as string || "\u2014"}</td>
                  <td className="px-0 py-2.5 text-charcoal tabular-nums">{Number(line.hours).toFixed(1)}</td>
                  <td className="px-0 py-2.5 text-charcoal-light tabular-nums">${Number(line.rate).toFixed(2)}/hr</td>
                  <td className="px-0 py-2.5 text-charcoal font-medium text-right tabular-nums">${Number(line.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-sage/30">
                <td colSpan={2} className="pt-3 pb-1 text-right text-sm font-semibold text-charcoal">Total Hours:</td>
                <td className="pt-3 pb-1 text-sm font-bold text-charcoal tabular-nums">{totalHours.toFixed(1)}</td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td colSpan={4} className="pb-3 text-right text-sm font-semibold text-charcoal">Total Due:</td>
                <td className="pb-3 text-right">
                  <span className="text-xl font-bold text-charcoal tabular-nums">${Number(invoice.total_amount).toFixed(2)}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-sage/20 bg-cream/30 print:bg-cream/40 rounded-b-xl print:rounded-none">
          <p className="text-center text-xs text-charcoal-light/60">
            Thank you for your partnership in supporting our students.
          </p>
        </div>
      </div>
    </div>
  );
}
