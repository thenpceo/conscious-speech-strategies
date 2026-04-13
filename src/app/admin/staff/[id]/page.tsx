"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import type { Role } from "@/lib/supabase/types";

export default function EditStaffPage() {
  const supabase = createClient();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [internalRate, setInternalRate] = useState("");
  const [externalRate, setExternalRate] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("profiles").select("*").eq("id", id).single().then(({ data }) => {
      if (data) {
        setName(data.name);
        setPhone(data.phone || "");
        setRole(data.role);
        setInternalRate(data.internal_rate != null ? String(data.internal_rate) : "");
        setExternalRate(data.external_rate != null ? String(data.external_rate) : "");
      }
      setLoading(false);
    });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        name,
        phone: phone || null,
        role,
        internal_rate: internalRate ? parseFloat(internalRate) : null,
        external_rate: externalRate ? parseFloat(externalRate) : null,
      })
      .eq("id", id);

    if (error) {
      alert("Error saving: " + error.message);
      setSaving(false);
      return;
    }

    router.push("/admin/staff");
  }

  const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400";

  if (loading) {
    return <p className="text-slate-400 text-sm py-10 text-center">Loading...</p>;
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <p className="text-[13px] text-slate-400">
          <a href="/admin/staff" className="hover:text-slate-600 transition-colors cursor-pointer">Staff</a>
          {" / Edit"}
        </p>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight mt-1">Edit Staff Member</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" className={inputClass} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={`${inputClass} cursor-pointer`}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 space-y-4">
          <p className="text-[13px] font-medium text-slate-700">Rates</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Internal Rate ($/hr)</label>
              <input type="number" step="0.01" min="0" value={internalRate}
                onChange={(e) => setInternalRate(e.target.value)}
                placeholder="0.00" className={inputClass} />
              <p className="text-[11px] text-slate-400 mt-1">Used for timesheets</p>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">External Rate ($/hr)</label>
              <input type="number" step="0.01" min="0" value={externalRate}
                onChange={(e) => setExternalRate(e.target.value)}
                placeholder="0.00" className={inputClass} />
              <p className="text-[11px] text-slate-400 mt-1">Used for school invoices</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium text-[13px] transition-colors disabled:opacity-50 cursor-pointer">
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2.5 rounded-lg font-medium text-[13px] text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
