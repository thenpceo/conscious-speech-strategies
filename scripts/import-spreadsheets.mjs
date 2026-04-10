/**
 * Bulk import script for Rachel's school spreadsheets.
 * Parses 4 xlsx files (SLAM Apollo, SLAM Tampa, Waterset Charter, Victory)
 * and imports students, goals, and session data into Supabase.
 *
 * Usage:
 *   node scripts/import-spreadsheets.mjs [--dry-run]
 *
 * Requires:
 *   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars (or .env.local)
 */

import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DRY_RUN = process.argv.includes("--dry-run");

const SCHOOLS = [
  {
    file: "SLAM APOLLO 25-26 RD.xlsx",
    schoolName: "SLAM Apollo",
    gradeSheets: ["K", "1", "2", "3", "4", "5", "6", "7", "10"],
  },
  {
    file: "SLAM Tampa 25-26.xlsx",
    schoolName: "SLAM Tampa",
    gradeSheets: ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "12"],
  },
  {
    file: "Waterset Charter 25-26.xlsx",
    schoolName: "Waterset Charter",
    gradeSheets: ["K", "1", "2", "3", "4", "5", "6", "7", "8"],
  },
  {
    file: "25-26 Victory.xlsx",
    schoolName: "Victory",
    gradeSheets: ["Kg", "2nd Grade", "6th Grade", "8th Grade"],
  },
];

// ---------------------------------------------------------------------------
// Supabase client
// ---------------------------------------------------------------------------

function loadEnv() {
  try {
    const envFile = readFileSync(resolve(PROJECT_ROOT, ".env.local"), "utf8");
    for (const line of envFile.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env.local not found, rely on actual env vars
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_KEY)) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.\n" +
    "Use --dry-run to test parsing without a database connection."
  );
  process.exit(1);
}

const supabase = !DRY_RUN
  ? createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
  : null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function excelDateToISO(serial) {
  if (!serial) return null;
  const num = Number(serial);
  if (isNaN(num) || num < 30000 || num > 100000) {
    // Try parsing as date string
    const d = new Date(serial);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
    return null;
  }
  const d = new Date((num - 25569) * 86400 * 1000);
  return d.toISOString().split("T")[0];
}

function isRedFont(cell) {
  if (!cell || !cell.font || !cell.font.color) return false;
  const argb = cell.font.color.argb;
  return argb === "FFFF0000";
}

function cellValue(cell) {
  if (!cell) return "";
  const v = cell.value;
  if (v === null || v === undefined) return "";
  if (typeof v === "object" && v.richText) {
    return v.richText.map((r) => r.text || "").join("");
  }
  return String(v).trim();
}

function normalizeStudentName(name) {
  // Normalize for matching: lowercase, remove extra spaces, handle "Last, First" vs "First Last"
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

// Grade sheet name → normalized grade value
function normalizeGrade(sheetName) {
  const map = {
    K: "K",
    Kg: "K",
    "2nd Grade": "2",
    "6th Grade": "6",
    "8th Grade": "8",
  };
  return map[sheetName] || sheetName;
}

// ---------------------------------------------------------------------------
// Parse Students sheet for contact info
// ---------------------------------------------------------------------------

function parseStudentsSheet(worksheet) {
  const contacts = new Map(); // normalizedName -> { phone, phone2, email }

  // Detect columns by scanning first few rows for header-like content
  let nameCol = -1,
    gradeCol = -1,
    phoneCol = -1,
    phone2Col = -1,
    emailCol = -1,
    minutesCol = -1;

  // Check row 1 for headers
  const headerRow = worksheet.getRow(1);
  for (let c = 1; c <= 15; c++) {
    const val = cellValue(headerRow.getCell(c)).toLowerCase();
    if (
      val.includes("student name") ||
      val === "name" ||
      val === "student"
    )
      nameCol = c;
    if (val.includes("grade")) gradeCol = c;
    if (val.includes("mom") || val.includes("phone number"))
      phoneCol = c;
    if (val.includes("dad") || val.includes("second"))
      phone2Col = c;
    if (val.includes("email")) emailCol = c;
    if (val.includes("minutes")) minutesCol = c;
  }

  // If no header detected, infer from data patterns per school
  // Scan rows 2-5 to find name column (longest text that looks like a name)
  if (nameCol === -1) {
    // Heuristic: name column usually has "Last, First" or "First Last"
    for (let r = 2; r <= Math.min(5, worksheet.rowCount); r++) {
      const row = worksheet.getRow(r);
      for (let c = 1; c <= 6; c++) {
        const v = cellValue(row.getCell(c));
        if (v.length > 5 && /[a-zA-Z]/.test(v) && (v.includes(",") || v.split(" ").length >= 2)) {
          if (nameCol === -1 || c < nameCol) nameCol = c;
        }
      }
      if (nameCol !== -1) break;
    }
  }

  // Scan data rows
  for (let r = 2; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    const name = nameCol > 0 ? cellValue(row.getCell(nameCol)) : "";
    if (!name || name.length < 3) continue;

    // Try to find contact info in remaining columns
    let phone = "",
      phone2 = "",
      email = "";

    if (phoneCol > 0) phone = cellValue(row.getCell(phoneCol));
    if (phone2Col > 0) phone2 = cellValue(row.getCell(phone2Col));
    if (emailCol > 0) email = cellValue(row.getCell(emailCol));

    // If no specific columns detected, scan all columns for phone/email patterns
    if (!phoneCol && !emailCol) {
      for (let c = 1; c <= 15; c++) {
        const v = cellValue(row.getCell(c));
        if (!v) continue;
        if (v.includes("@") && !email) {
          email = v;
        } else if (/[\d\(\)\-~]{7,}/.test(v) && !phone) {
          phone = v;
        } else if (/[\d\(\)\-~]{7,}/.test(v) && phone && !phone2) {
          phone2 = v;
        }
      }
    }

    const normalized = normalizeStudentName(name);
    contacts.set(normalized, { phone, phone2, email, name });
  }

  return contacts;
}

// ---------------------------------------------------------------------------
// Parse a grade sheet
// ---------------------------------------------------------------------------

function parseGradeSheet(worksheet, gradeName) {
  const students = [];
  const grade = normalizeGrade(gradeName);

  // Find all student block starts (col A = "Name" with non-empty col B)
  const blockStarts = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNum) => {
    const valA = cellValue(row.getCell(1));
    if (valA === "Name" || valA === " ") {
      const valB = cellValue(row.getCell(2));
      if (valB.length > 2) {
        blockStarts.push(rowNum);
      }
    }
  });

  // Also detect blocks where col A is empty but has "Name" pattern
  worksheet.eachRow({ includeEmpty: false }, (row, rowNum) => {
    const valA = cellValue(row.getCell(1));
    if (valA === "Name") {
      if (!blockStarts.includes(rowNum)) blockStarts.push(rowNum);
    }
  });
  blockStarts.sort((a, b) => a - b);

  for (let bi = 0; bi < blockStarts.length; bi++) {
    const startRow = blockStarts[bi];
    const endRow = bi + 1 < blockStarts.length ? blockStarts[bi + 1] - 1 : startRow + 15;

    const headerRow = worksheet.getRow(startRow);
    const nameCell = headerRow.getCell(2);

    // Check for red font — skip if red
    if (isRedFont(nameCell)) {
      continue;
    }

    // Also check col A for red font
    if (isRedFont(headerRow.getCell(1))) {
      continue;
    }

    const studentName = cellValue(nameCell);
    if (!studentName || studentName.length < 2) continue;

    // Row 0 (startRow): Name | StudentName | Teacher | TeacherName | Eligibility | Type
    const teacher = cellValue(headerRow.getCell(4));
    const eligibility = cellValue(headerRow.getCell(6));

    // Row 1 (startRow+1): Number | value | DOB | value | Re-Eval Due | value
    const row1 = worksheet.getRow(startRow + 1);
    const studentNumber = cellValue(row1.getCell(2));
    const dobRaw = cellValue(row1.getCell(4));
    const reEvalRaw = cellValue(row1.getCell(6));

    // Row 2 (startRow+2): Grade | value | Minutes | value | IEP Due | value
    const row2 = worksheet.getRow(startRow + 2);
    const minutesRaw = cellValue(row2.getCell(4));
    const iepDueRaw = cellValue(row2.getCell(6));

    // Parse goals (rows after row2, in col A, starting with a number or text)
    const goals = [];
    for (let r = startRow + 3; r <= endRow; r++) {
      const row = worksheet.getRow(r);
      const goalText = cellValue(row.getCell(1));
      if (!goalText) continue;
      // Goals typically start with "1.", "2." or are full sentences
      if (/^\d+\./.test(goalText) || goalText.length > 30) {
        goals.push(goalText);
      }
    }

    // Parse session data horizontally (cols 7+)
    // First, find the session column structure from the header row or row 0
    // Pattern: look for cells with dates (Excel serial numbers > 40000)
    const sessions = parseSessionsHorizontal(worksheet, startRow, endRow);

    students.push({
      name: studentName,
      studentNumber: studentNumber || null,
      dob: excelDateToISO(dobRaw),
      grade,
      teacher: teacher || null,
      eligibility: eligibility || null,
      serviceMinutes: minutesRaw || null,
      iepDate: excelDateToISO(iepDueRaw),
      reEvalDate: excelDateToISO(reEvalRaw),
      goals,
      sessions,
    });
  }

  return students;
}

// ---------------------------------------------------------------------------
// Parse horizontal session data
// ---------------------------------------------------------------------------

function parseSessionsHorizontal(worksheet, startRow, endRow) {
  const sessions = [];

  // Scan row 1 (first data row, startRow+1) for date values in cols 7+
  // Dates appear as Excel serial numbers > 40000
  const dataRow = worksheet.getRow(startRow + 1);
  const headerRow = worksheet.getRow(startRow);

  // Find all date columns
  const dateCols = [];
  for (let c = 7; c <= worksheet.columnCount; c++) {
    const headerVal = cellValue(headerRow.getCell(c)).toLowerCase();
    const dataVal = cellValue(dataRow.getCell(c));

    // Check if header says "Date" or if data looks like a date serial
    if (headerVal === "date" || headerVal === "notes") {
      dateCols.push({ col: c, type: headerVal === "notes" ? "notes" : "date" });
    } else {
      const num = Number(dataVal);
      if (!isNaN(num) && num > 40000 && num < 100000) {
        dateCols.push({ col: c, type: "date" });
      }
    }
  }

  // For each date column, determine what follows it
  // Pattern A (full session): Date | Goal | Performance | Percent | Materials/notes
  // Pattern B (absence): Date | Notes
  for (const dateCol of dateCols) {
    if (dateCol.type === "notes") continue; // Skip "Notes" header columns

    // Check header labels after this date column
    const nextHeaders = [];
    for (let c = dateCol.col + 1; c <= dateCol.col + 5 && c <= worksheet.columnCount; c++) {
      nextHeaders.push(cellValue(headerRow.getCell(c)).toLowerCase());
    }

    const isFullSession =
      nextHeaders[0]?.includes("goal") ||
      nextHeaders[1]?.includes("performance") ||
      nextHeaders.length >= 3;

    // Collect session data across all student rows in this block
    for (let r = startRow + 1; r <= Math.min(endRow, startRow + 10); r++) {
      const row = worksheet.getRow(r);
      const dateVal = cellValue(row.getCell(dateCol.col));
      if (!dateVal) continue;

      const date = excelDateToISO(dateVal);
      if (!date) {
        // Might be a note like "student absent"
        if (dateVal.length > 2) {
          sessions.push({
            date: null,
            target: null,
            performanceLevel: null,
            percentage: null,
            notes: dateVal,
          });
        }
        continue;
      }

      // Check next column for data
      const col2Val = cellValue(row.getCell(dateCol.col + 1));
      const col3Val = cellValue(row.getCell(dateCol.col + 2));
      const col4Val = cellValue(row.getCell(dateCol.col + 3));
      const col5Val = cellValue(row.getCell(dateCol.col + 4));

      // If the next header is "Notes" or data looks like a note string
      const nextHeader = cellValue(headerRow.getCell(dateCol.col + 1)).toLowerCase();
      if (nextHeader === "notes" || nextHeader === "") {
        if (col2Val) {
          sessions.push({
            date,
            target: null,
            performanceLevel: null,
            percentage: null,
            notes: col2Val,
          });
        }
      } else {
        // Full session: Goal | Performance | Percent | Materials
        const target = col2Val || null;
        const performanceLevel = col3Val || null;
        let percentage = null;
        if (col4Val) {
          const pNum = parseFloat(col4Val);
          if (!isNaN(pNum)) {
            percentage = pNum > 1 ? pNum / 100 : pNum; // normalize to 0-1
          }
        }
        const notes = col5Val || null;

        if (target || performanceLevel || percentage !== null) {
          sessions.push({
            date,
            target,
            performanceLevel,
            percentage,
            notes,
          });
        }
      }
    }
  }

  // Deduplicate sessions by date+target
  const seen = new Set();
  const unique = [];
  for (const s of sessions) {
    const key = `${s.date}|${s.target}|${s.performanceLevel}|${s.percentage}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(s);
    }
  }

  return unique;
}

// ---------------------------------------------------------------------------
// Merge students from multiple blocks (same student, different service types)
// ---------------------------------------------------------------------------

function mergeStudentBlocks(students) {
  const merged = new Map(); // normalizedName -> student

  for (const s of students) {
    const key = normalizeStudentName(s.name);
    if (merged.has(key)) {
      const existing = merged.get(key);
      // Merge goals (avoid duplicates)
      const existingGoals = new Set(existing.goals.map((g) => g.substring(0, 50)));
      for (const g of s.goals) {
        if (!existingGoals.has(g.substring(0, 50))) {
          existing.goals.push(g);
        }
      }
      // Merge sessions
      existing.sessions.push(...s.sessions);
      // Merge service minutes
      if (s.serviceMinutes && existing.serviceMinutes) {
        existing.serviceMinutes += `, ${s.serviceMinutes}`;
      } else if (s.serviceMinutes) {
        existing.serviceMinutes = s.serviceMinutes;
      }
      // Merge eligibility
      if (s.eligibility && existing.eligibility && !existing.eligibility.includes(s.eligibility)) {
        existing.eligibility += `, ${s.eligibility}`;
      }
      // Fill in blanks
      if (!existing.studentNumber && s.studentNumber) existing.studentNumber = s.studentNumber;
      if (!existing.dob && s.dob) existing.dob = s.dob;
      if (!existing.teacher && s.teacher) existing.teacher = s.teacher;
      if (!existing.iepDate && s.iepDate) existing.iepDate = s.iepDate;
      if (!existing.reEvalDate && s.reEvalDate) existing.reEvalDate = s.reEvalDate;
    } else {
      merged.set(key, { ...s });
    }
  }

  return Array.from(merged.values());
}

// ---------------------------------------------------------------------------
// Main import
// ---------------------------------------------------------------------------

async function ensureSchool(schoolName, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Check if school exists
      const { data: existing } = await supabase
        .from("schools")
        .select("id")
        .eq("name", schoolName)
        .single();

      if (existing) return existing.id;

      // Create it
      const { data, error } = await supabase
        .from("schools")
        .insert({ name: schoolName })
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      return data.id;
    } catch (e) {
      console.error(`  Attempt ${attempt}/${retries} failed for school ${schoolName}:`, e.message);
      if (attempt < retries) {
        console.log(`  Retrying in 5 seconds...`);
        await new Promise((r) => setTimeout(r, 5000));
      } else {
        console.error(`  All retries exhausted for school ${schoolName}`);
        process.exit(1);
      }
    }
  }
}

async function importSchool(config) {
  const filePath = resolve(PROJECT_ROOT, config.file);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Processing: ${config.file} → school "${config.schoolName}"`);
  console.log(`${"=".repeat(60)}`);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  // 1. Parse Students sheet for contact info
  const studentsSheet = workbook.getWorksheet("Students");
  const contacts = studentsSheet
    ? parseStudentsSheet(studentsSheet)
    : new Map();
  console.log(`  Contacts parsed from Students sheet: ${contacts.size}`);

  // 2. Parse grade sheets
  let allStudents = [];
  for (const sheetName of config.gradeSheets) {
    const ws = workbook.getWorksheet(sheetName);
    if (!ws) {
      console.log(`  Warning: sheet "${sheetName}" not found, skipping`);
      continue;
    }
    const students = parseGradeSheet(ws, sheetName);
    console.log(`  Sheet "${sheetName}": ${students.length} students (non-red)`);
    allStudents.push(...students);
  }

  // 3. Merge duplicate student blocks
  allStudents = mergeStudentBlocks(allStudents);
  console.log(`  After merging: ${allStudents.length} unique students`);

  // 4. Enrich with contact info from Students sheet
  for (const student of allStudents) {
    const key = normalizeStudentName(student.name);
    // Try matching by full name
    let contact = contacts.get(key);

    // Try matching by last name, first name → first name last name
    if (!contact) {
      // Try "Last, First" → "First Last" conversion
      if (student.name.includes(",")) {
        const parts = student.name.split(",").map((s) => s.trim());
        const flipped = `${parts[1]} ${parts[0]}`;
        contact = contacts.get(normalizeStudentName(flipped));
      }
    }

    // Try fuzzy match: check if any contact name contains this student name or vice versa
    if (!contact) {
      for (const [cKey, cVal] of contacts) {
        if (key.includes(cKey) || cKey.includes(key)) {
          contact = cVal;
          break;
        }
      }
    }

    if (contact) {
      student.parentPhone = contact.phone || null;
      student.parentPhone2 = contact.phone2 || null;
      student.parentEmail = contact.email || null;
    }
  }

  // 5. Check if school already has students (skip if re-running)
  if (!DRY_RUN) {
    const { data: existingSchool } = await supabase
      .from("schools")
      .select("id")
      .eq("name", config.schoolName)
      .single();

    if (existingSchool) {
      const { count } = await supabase
        .from("students")
        .select("id", { count: "exact", head: true })
        .eq("school_id", existingSchool.id);

      if (count && count > 0) {
        console.log(`\n  SKIPPING: "${config.schoolName}" already has ${count} students in database.`);
        console.log(`  Delete existing students first if you want to re-import.`);
        return { inserted: 0, failed: 0 };
      }
    }
  }

  // 6. Insert into database
  if (DRY_RUN) {
    console.log(`\n  [DRY RUN] Would insert ${allStudents.length} students:`);
    for (const s of allStudents) {
      console.log(
        `    - ${s.name} (grade ${s.grade}, ${s.goals.length} goals, ${s.sessions.length} sessions)`
      );
    }
    return { inserted: 0, failed: 0 };
  }

  const schoolId = await ensureSchool(config.schoolName);
  let inserted = 0,
    failed = 0;

  for (const student of allStudents) {
    // Insert student
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .insert({
        name: student.name,
        school_id: schoolId,
        student_number: student.studentNumber,
        date_of_birth: student.dob,
        grade: student.grade,
        teacher: student.teacher,
        eligibility: student.eligibility,
        service_minutes: student.serviceMinutes,
        iep_date: student.iepDate,
        iep_re_eval_date: student.reEvalDate,
        parent_phone: student.parentPhone || null,
        parent_phone_2: student.parentPhone2 || null,
        parent_email: student.parentEmail || null,
      })
      .select("id")
      .single();

    if (studentError || !studentData) {
      console.error(`  Failed to insert student ${student.name}:`, studentError?.message);
      failed++;
      continue;
    }

    const studentId = studentData.id;

    // Insert goals
    if (student.goals.length > 0) {
      const { error: goalsError } = await supabase.from("goals").insert(
        student.goals.map((desc, i) => ({
          student_id: studentId,
          goal_number: i + 1,
          description: desc,
        }))
      );
      if (goalsError) {
        console.error(`  Failed to insert goals for ${student.name}:`, goalsError.message);
      }
    }

    // Insert sessions & session_goals
    // Fetch the goals we just created to get their IDs
    const { data: goalRecords } = await supabase
      .from("goals")
      .select("id, goal_number")
      .eq("student_id", studentId)
      .order("goal_number");

    for (const sess of student.sessions) {
      if (!sess.date) continue; // Skip sessions without dates

      // Create session
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .insert({
          student_id: studentId,
          date: sess.date,
          notes: sess.notes,
        })
        .select("id")
        .single();

      if (sessionError || !sessionData) continue;

      // Create session_goal if we have performance data
      if (sess.target || sess.performanceLevel || sess.percentage !== null) {
        // Try to match target to a goal
        const goalId = goalRecords?.[0]?.id; // Default to first goal

        if (goalId) {
          let correctCount = 0,
            totalCount = 0;
          if (sess.percentage !== null) {
            totalCount = 100;
            correctCount = Math.round(sess.percentage * 100);
          }

          await supabase.from("session_goals").insert({
            session_id: sessionData.id,
            goal_id: goalId,
            correct_count: correctCount,
            total_count: totalCount,
            target: sess.target,
            performance_level: sess.performanceLevel,
            notes: sess.notes,
          });
        }
      }
    }

    inserted++;
    process.stdout.write(`  Inserted: ${inserted}/${allStudents.length}\r`);
  }

  console.log(`\n  Done: ${inserted} inserted, ${failed} failed`);
  return { inserted, failed };
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main() {
  console.log("Conscious Speech - Bulk Data Import");
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);

  let totalInserted = 0,
    totalFailed = 0;

  for (const config of SCHOOLS) {
    const { inserted, failed } = await importSchool(config);
    totalInserted += inserted;
    totalFailed += failed;
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`TOTAL: ${totalInserted} students inserted, ${totalFailed} failed`);
  console.log(`${"=".repeat(60)}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
