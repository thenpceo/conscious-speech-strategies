"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import type { Student, School } from "@/lib/supabase/types";

export default function StudentsPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [search, setSearch] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [{ data: studentsData }, { data: schoolsData }] = await Promise.all([
      supabase
        .from("students")
        .select("*, school:schools(name)")
        .eq("archived", false)
        .order("name"),
      supabase.from("schools").select("*").order("name"),
    ]);
    if (studentsData) setStudents(studentsData as Student[]);
    if (schoolsData) setSchools(schoolsData);
  }

  const filtered = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesSchool = !schoolFilter || s.school_id === schoolFilter;
    return matchesSearch && matchesSchool;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Students</h1>
        <Link
          href="/admin/students/new"
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
        >
          Add Student
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400"
          />
        </div>
        <select
          value={schoolFilter}
          onChange={(e) => setSchoolFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900 cursor-pointer"
        >
          <option value="">All Schools</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm">
        {filtered.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filtered.map((student) => (
              <Link
                key={student.id}
                href={`/admin/students/${student.id}`}
                className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors block cursor-pointer"
              >
                <div>
                  <p className="font-medium text-slate-900 text-[14px]">{student.name}</p>
                  <p className="text-[13px] text-slate-400 mt-0.5">
                    {student.school?.name}
                    {student.iep_date && ` · IEP: ${new Date(student.iep_date).toLocaleDateString()}`}
                  </p>
                </div>
                <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ))}
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-slate-400 text-sm">
            {search || schoolFilter ? "No students match your filters." : "No students yet. Add your first student to get started."}
          </p>
        )}
      </div>
    </div>
  );
}
