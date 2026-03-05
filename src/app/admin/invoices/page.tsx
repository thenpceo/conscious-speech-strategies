"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function InvoicesPage() {
  const supabase = createClient();
  const [invoices, setInvoices] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    supabase
      .from("invoices")
      .select("*, school:schools(name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setInvoices(data);
      });
  }, []);

  const statusColors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    sent: "bg-sky-50 text-sky-700 border border-sky-200",
    paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Invoices</h1>
        <Link href="/admin/invoices/new"
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer">
          Generate Invoice
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        {invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-200 text-left bg-slate-50/50">
                  <th className="px-5 py-3 text-slate-500 font-medium">School</th>
                  <th className="px-5 py-3 text-slate-500 font-medium">Period</th>
                  <th className="px-5 py-3 text-slate-500 font-medium">Amount</th>
                  <th className="px-5 py-3 text-slate-500 font-medium">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id as string} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 text-slate-900 font-medium">{(inv.school as Record<string, unknown>)?.name as string}</td>
                    <td className="px-5 py-3 text-slate-600 tabular-nums">
                      {new Date(inv.period_start as string).toLocaleDateString()} — {new Date(inv.period_end as string).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-slate-900 font-semibold tabular-nums">${Number(inv.total_amount).toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status as string] || ""}`}>
                        {(inv.status as string)?.charAt(0).toUpperCase() + (inv.status as string)?.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/invoices/${inv.id}`}
                        className="text-teal-600 hover:text-teal-700 text-[13px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1">
                        View
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-slate-400 text-sm">No invoices yet. Generate your first invoice.</p>
        )}
      </div>
    </div>
  );
}
