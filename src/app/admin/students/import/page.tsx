"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
import type { School } from "@/lib/supabase/types";

interface ParsedRow {
  [key: string]: string;
}

interface MappedStudent {
  name: string;
  schoolName: string;
  schoolId: string | null;
  iepDate: string;
  notes: string;
  goals: string[];
  errors: string[];
}

const EXPECTED_COLUMNS = ["name", "school", "iep_date", "iep date", "notes"];
const GOAL_PATTERN = /^goal\s*\d*$/i;

function guessMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const h of headers) {
    const lower = h.toLowerCase().trim();
    if (lower === "name" || lower === "student name" || lower === "student") {
      mapping["name"] = h;
    } else if (lower === "school" || lower === "school name") {
      mapping["school"] = h;
    } else if (lower === "iep_date" || lower === "iep date" || lower === "iep") {
      mapping["iep_date"] = h;
    } else if (lower === "notes" || lower === "note") {
      mapping["notes"] = h;
    }
  }
  return mapping;
}

function findGoalColumns(headers: string[]): string[] {
  return headers.filter((h) => GOAL_PATTERN.test(h.trim()));
}

function parseDate(value: string): string {
  if (!value) return "";
  // Handle Excel serial dates
  const num = Number(value);
  if (!isNaN(num) && num > 30000 && num < 100000) {
    const date = new Date((num - 25569) * 86400 * 1000);
    return date.toISOString().split("T")[0];
  }
  // Try parsing as date string
  const d = new Date(value);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }
  return "";
}

export default function ImportStudentsPage() {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [schools, setSchools] = useState<School[]>([]);
  const [rawRows, setRawRows] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [goalColumns, setGoalColumns] = useState<string[]>([]);
  const [mapped, setMapped] = useState<MappedStudent[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [importResult, setImportResult] = useState({ success: 0, failed: 0 });
  const [parseError, setParseError] = useState("");
  const [defaultSchool, setDefaultSchool] = useState("");

  useEffect(() => {
    supabase
      .from("schools")
      .select("*")
      .order("name")
      .then(({ data }) => {
        if (data) setSchools(data);
      });
  }, []);

  const processFile = useCallback(
    (file: File) => {
      setParseError("");
      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json<ParsedRow>(sheet, { defval: "" });

          if (json.length === 0) {
            setParseError("The spreadsheet appears to be empty.");
            return;
          }

          const hdrs = Object.keys(json[0]);
          setHeaders(hdrs);
          setRawRows(json);

          const autoMapping = guessMapping(hdrs);
          setMapping(autoMapping);
          setGoalColumns(findGoalColumns(hdrs));
          setStep("preview");
        } catch {
          setParseError("Could not parse the file. Please use a .xlsx or .csv file.");
        }
      };
      reader.readAsArrayBuffer(file);
    },
    []
  );

  // Re-map whenever mapping, rawRows, schools, or defaultSchool changes
  useEffect(() => {
    if (rawRows.length === 0) return;

    const schoolLookup = new Map<string, string>();
    for (const s of schools) {
      schoolLookup.set(s.name.toLowerCase().trim(), s.id);
    }

    const result: MappedStudent[] = rawRows.map((row) => {
      const name = (mapping.name ? row[mapping.name] : "")?.toString().trim() || "";
      const schoolName = (mapping.school ? row[mapping.school] : "")?.toString().trim() || "";
      const iepRaw = (mapping.iep_date ? row[mapping.iep_date] : "")?.toString().trim() || "";
      const notes = (mapping.notes ? row[mapping.notes] : "")?.toString().trim() || "";

      const goals = goalColumns
        .map((col) => (row[col] || "").toString().trim())
        .filter(Boolean);

      const errors: string[] = [];
      if (!name) errors.push("Missing name");

      let schoolId: string | null = null;
      if (schoolName) {
        schoolId = schoolLookup.get(schoolName.toLowerCase().trim()) || null;
        if (!schoolId) errors.push(`School "${schoolName}" not found`);
      } else if (defaultSchool) {
        schoolId = defaultSchool;
      } else {
        errors.push("Missing school");
      }

      return {
        name,
        schoolName,
        schoolId,
        iepDate: parseDate(iepRaw),
        notes,
        goals,
        errors,
      };
    });

    setMapped(result);
  }, [rawRows, mapping, goalColumns, schools, defaultSchool]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  async function handleImport() {
    setStep("importing");
    const { data: { user } } = await supabase.auth.getUser();
    let success = 0;
    let failed = 0;

    const valid = mapped.filter((s) => s.errors.length === 0);

    for (const student of valid) {
      const { data, error } = await supabase
        .from("students")
        .insert({
          name: student.name,
          school_id: student.schoolId,
          iep_date: student.iepDate || null,
          notes: student.notes || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error || !data) {
        failed++;
        continue;
      }

      if (student.goals.length > 0) {
        await supabase.from("goals").insert(
          student.goals.map((desc, i) => ({
            student_id: data.id,
            goal_number: i + 1,
            description: desc,
          }))
        );
      }

      success++;
    }

    setImportResult({ success, failed });
    setStep("done");
  }

  const validCount = mapped.filter((s) => s.errors.length === 0).length;
  const errorCount = mapped.filter((s) => s.errors.length > 0).length;

  const inputClass =
    "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400";

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/students"
          className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Import Students</h1>
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`bg-white rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-teal-400 bg-teal-50/50"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="text-[14px] font-medium text-slate-700">
              Drop a spreadsheet here, or click to browse
            </p>
            <p className="text-[13px] text-slate-400 mt-1">
              Supports .xlsx, .xls, and .csv files
            </p>
          </div>

          {parseError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-[13px] text-red-700">
              {parseError}
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 text-[15px] mb-3">Expected Format</h2>
            <p className="text-[13px] text-slate-500 mb-4">
              Your spreadsheet should have column headers in the first row. We&apos;ll auto-detect these columns:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 pr-4 font-medium text-slate-700">Column</th>
                    <th className="text-left py-2 pr-4 font-medium text-slate-700">Required</th>
                    <th className="text-left py-2 font-medium text-slate-700">Description</th>
                  </tr>
                </thead>
                <tbody className="text-slate-500">
                  <tr className="border-b border-slate-50">
                    <td className="py-2 pr-4 font-mono text-teal-600">Name</td>
                    <td className="py-2 pr-4">Yes</td>
                    <td className="py-2">Student&apos;s full name</td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 pr-4 font-mono text-teal-600">School</td>
                    <td className="py-2 pr-4">Yes</td>
                    <td className="py-2">Must match an existing school name</td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 pr-4 font-mono text-teal-600">IEP Date</td>
                    <td className="py-2 pr-4">No</td>
                    <td className="py-2">Date in any common format</td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 pr-4 font-mono text-teal-600">Notes</td>
                    <td className="py-2 pr-4">No</td>
                    <td className="py-2">Any additional notes</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-teal-600">Goal 1, Goal 2, ...</td>
                    <td className="py-2 pr-4">No</td>
                    <td className="py-2">IEP goal descriptions (one per column)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Preview & Map */}
      {step === "preview" && (
        <div className="space-y-4">
          {/* File info */}
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <div>
                <p className="text-[14px] font-medium text-slate-900">{fileName}</p>
                <p className="text-[12px] text-slate-400">{rawRows.length} rows found</p>
              </div>
            </div>
            <button
              onClick={() => {
                setStep("upload");
                setRawRows([]);
                setHeaders([]);
                setMapped([]);
                setFileName("");
              }}
              className="text-[13px] text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
            >
              Change File
            </button>
          </div>

          {/* Column mapping */}
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-slate-900 text-[15px]">Column Mapping</h2>
            <p className="text-[13px] text-slate-500">
              We auto-detected your columns. Adjust if needed:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {["name", "school", "iep_date", "notes"].map((field) => (
                <div key={field}>
                  <label className="block text-[13px] font-medium text-slate-700 mb-1.5 capitalize">
                    {field.replace("_", " ")}
                    {(field === "name" || field === "school") && " *"}
                  </label>
                  <select
                    value={mapping[field] || ""}
                    onChange={(e) =>
                      setMapping({ ...mapping, [field]: e.target.value })
                    }
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="">— Not mapped —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Default school fallback */}
            {mapping.school && (
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                  Default school (for rows with no school)
                </label>
                <select
                  value={defaultSchool}
                  onChange={(e) => setDefaultSchool(e.target.value)}
                  className={`${inputClass} cursor-pointer max-w-sm`}
                >
                  <option value="">— None —</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Goal columns */}
            {goalColumns.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[13px] text-slate-500">
                  <span className="font-medium text-slate-700">Goal columns detected:</span>{" "}
                  {goalColumns.join(", ")}
                </p>
              </div>
            )}
          </div>

          {/* Summary bar */}
          <div className="flex items-center gap-4 text-[13px]">
            {validCount > 0 && (
              <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                {validCount} ready to import
              </span>
            )}
            {errorCount > 0 && (
              <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                {errorCount} with errors (will be skipped)
              </span>
            )}
          </div>

          {/* Preview table */}
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="text-left px-4 py-3 font-medium text-slate-500 w-8">#</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">School</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">IEP Date</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Goals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {mapped.map((row, i) => (
                    <tr
                      key={i}
                      className={row.errors.length > 0 ? "bg-amber-50/40" : ""}
                    >
                      <td className="px-4 py-3 text-slate-400 tabular-nums">{i + 1}</td>
                      <td className="px-4 py-3">
                        {row.errors.length > 0 ? (
                          <span
                            className="inline-flex items-center gap-1 text-amber-600"
                            title={row.errors.join(", ")}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                            </svg>
                            <span className="text-[12px] max-w-[200px] truncate">{row.errors[0]}</span>
                          </span>
                        ) : (
                          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{row.name || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.schoolId ? (
                          row.schoolName || schools.find((s) => s.id === row.schoolId)?.name
                        ) : (
                          <span className="text-amber-600">{row.schoolName || "—"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.iepDate || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.goals.length > 0 ? (
                          <span className="text-teal-600 font-medium">{row.goals.length}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={validCount === 0}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium text-[13px] transition-colors disabled:opacity-50 cursor-pointer"
            >
              Import {validCount} Student{validCount !== 1 ? "s" : ""}
            </button>
            <button
              onClick={() => {
                setStep("upload");
                setRawRows([]);
                setHeaders([]);
                setMapped([]);
                setFileName("");
              }}
              className="px-6 py-2.5 rounded-lg font-medium text-[13px] text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Importing */}
      {step === "importing" && (
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-12 text-center">
          <div className="w-10 h-10 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[14px] font-medium text-slate-700">Importing students...</p>
          <p className="text-[13px] text-slate-400 mt-1">This may take a moment.</p>
        </div>
      )}

      {/* Step 4: Done */}
      {step === "done" && (
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Import Complete</h2>
          <p className="text-[14px] text-slate-500 mb-6">
            Successfully imported {importResult.success} student{importResult.success !== 1 ? "s" : ""}.
            {importResult.failed > 0 && ` ${importResult.failed} failed.`}
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/admin/students"
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium text-[13px] transition-colors cursor-pointer"
            >
              View Students
            </Link>
            <button
              onClick={() => {
                setStep("upload");
                setRawRows([]);
                setHeaders([]);
                setMapped([]);
                setFileName("");
                setImportResult({ success: 0, failed: 0 });
              }}
              className="px-6 py-2.5 rounded-lg font-medium text-[13px] text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Import More
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
