"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import type { School } from "@/lib/supabase/types";

export default function EditHoursPage() {
  const supabase = createClient();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [schools, setSchools] = useState<School[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    school_id: "",
    date: "",
    hours: "",
    description: "",
  });

  useEffect(() => {
    async function load() {
      const [{ data: entry }, { data: sc }] = await Promise.all([
        supabase.from("hours").select("*").eq("id", id).single(),
        supabase.from("schools").select("*").order("name"),
      ]);

      if (sc) setSchools(sc);
      if (entry) {
        setForm({
          school_id: entry.school_id || "",
          date: entry.date || "",
          hours: String(entry.hours),
          description: entry.description || "",
        });
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.from("hours").update({
      school_id: form.school_id,
      date: form.date,
      hours: parseFloat(form.hours),
      description: form.description || null,
    }).eq("id", id);

    if (error) {
      alert("Error updating hours: " + error.message);
      setSaving(false);
      return;
    }

    router.push("/admin/hours");
  }

  async function handleDelete() {
    if (!confirm("Delete this hours entry?")) return;
    setDeleting(true);

    const { error } = await supabase.from("hours").delete().eq("id", id);
    if (error) {
      alert("Error deleting: " + error.message);
      setDeleting(false);
      return;
    }

    router.push("/admin/hours");
  }

  const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400";

  if (loading) return null;

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-slate-900 tracking-tight mb-6">Edit Hours</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">School *</label>
          <select required value={form.school_id} onChange={(e) => setForm({ ...form, school_id: e.target.value })}
            className={`${inputClass} cursor-pointer`}>
            <option value="">Select a school...</option>
            {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Date *</label>
          <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Hours *</label>
          <input type="number" step="0.25" min="0" required value={form.hours}
            onChange={(e) => setForm({ ...form, hours: e.target.value })}
            placeholder="e.g. 3.5" className={inputClass} />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Description</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description..." className={inputClass} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium text-[13px] transition-colors disabled:opacity-50 cursor-pointer">
            {saving ? "Saving..." : "Update Hours"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2.5 rounded-lg font-medium text-[13px] text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">Cancel</button>
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="ml-auto px-4 py-2.5 rounded-lg font-medium text-[13px] text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer">
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </form>
    </div>
  );
}
