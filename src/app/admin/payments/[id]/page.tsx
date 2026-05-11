import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PrintableTimesheet from "./PrintableTimesheet";

export default async function TimesheetPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: timesheet } = await supabase
    .from("timesheets")
    .select(
      "*, profile:profiles!user_id(name, rate_per_hour, internal_rate)"
    )
    .eq("id", id)
    .single();

  if (!timesheet) notFound();

  const { data: timesheetHours } = await supabase
    .from("timesheet_hours")
    .select(
      "hours:hours!hours_id(id, date, hours, description, category, time_in, time_out, school:schools(name))"
    )
    .eq("timesheet_id", id);

  const hours = (timesheetHours || [])
    .map((th: { hours: unknown }) => th.hours)
    .filter(Boolean) as {
    id: string;
    date: string;
    hours: number;
    description: string | null;
    category: string | null;
    time_in: string | null;
    time_out: string | null;
    school: { name: string } | null;
  }[];

  hours.sort((a, b) => a.date.localeCompare(b.date));

  return <PrintableTimesheet timesheet={timesheet} hours={hours} />;
}
