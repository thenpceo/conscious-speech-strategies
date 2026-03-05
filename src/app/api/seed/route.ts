import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Check if schools already exist
  const { count } = await supabase
    .from("schools")
    .select("*", { count: "exact", head: true });

  if (count && count > 0) {
    return NextResponse.json({ message: `Schools already seeded (${count} exist)` });
  }

  const { data, error } = await supabase.from("schools").insert([
    { name: "Pinellas Charter Academy", address: "5432 Park Blvd, Pinellas Park, FL 33781", contact_name: "Maria Santos", contact_email: "msantos@pinellascharter.org" },
    { name: "Bay Point Academy", address: "1200 Bay Point Dr, St Petersburg, FL 33705", contact_name: "David Chen", contact_email: "dchen@baypointacademy.org" },
    { name: "Gulf Coast Preparatory", address: "3300 Gulf Blvd, Gulfport, FL 33707", contact_name: "Jennifer Walsh", contact_email: "jwalsh@gulfcoastprep.org" },
    { name: "Sunshine Charter School", address: "890 Central Ave, St Petersburg, FL 33701", contact_name: "Robert Martinez", contact_email: "rmartinez@sunshinecharter.org" },
  ]).select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: `Seeded ${data.length} schools!`, schools: data.map(s => s.name) });
}
