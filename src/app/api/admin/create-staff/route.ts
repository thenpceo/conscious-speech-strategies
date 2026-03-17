// POST /api/admin/create-staff
// Admin-only endpoint: creates a new staff user via Supabase Auth invite
//
// FLOW:
//   Admin submits form ──▶ validate input ──▶ check caller is admin
//         ──▶ create auth user (invite) ──▶ upsert profile ──▶ respond
//
// ERRORS:
//   - Missing fields → 400
//   - Caller not admin → 403
//   - Duplicate email → 409
//   - Service key missing → 500 (logged)
//   - Supabase error → 500 (logged)

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

// Service role client for admin operations (user creation)
function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY — required to create users");
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(req: NextRequest) {
  // 1. Verify the caller is an admin
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!callerProfile || callerProfile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden — admin role required" }, { status: 403 });
  }

  // 2. Parse and validate input
  let body: { email?: string; name?: string; phone?: string; rate_per_hour?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, name, phone, rate_per_hour } = body;

  if (!email || !name) {
    return NextResponse.json({ error: "Email and name are required" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  // 3. Create the user via service role (sends invite email)
  let serviceClient;
  try {
    serviceClient = createServiceClient();
  } catch (err) {
    console.error("[create-staff] Service client error:", err);
    return NextResponse.json(
      { error: "Server configuration error — contact administrator" },
      { status: 500 }
    );
  }

  // Check if user already exists
  const { data: existingUsers } = await serviceClient.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (existingUser) {
    return NextResponse.json(
      { error: "A user with this email already exists" },
      { status: 409 }
    );
  }

  // 3. Create user AND send invite email in one step
  // inviteUserByEmail creates the auth user + sends the invite email
  const { data: inviteData, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(
    email,
    {
      data: { name },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://consciousspeech.net"}/admin/setup`,
    }
  );

  if (inviteError) {
    console.error("[create-staff] Invite failed:", inviteError.message);
    return NextResponse.json(
      { error: `Failed to invite user: ${inviteError.message}` },
      { status: 500 }
    );
  }

  if (!inviteData?.user) {
    return NextResponse.json({ error: "Invite returned no user" }, { status: 500 });
  }

  // 4. Upsert profile (the DB trigger may have created one, so upsert)
  const { error: profileError } = await serviceClient
    .from("profiles")
    .upsert({
      id: inviteData.user.id,
      name,
      role: "staff",
      phone: phone || null,
      rate_per_hour: rate_per_hour || null,
    });

  if (profileError) {
    console.error("[create-staff] Profile upsert failed:", profileError.message);
  }

  return NextResponse.json({
    success: true,
    user: {
      id: inviteData.user.id,
      email,
      name,
      role: "staff",
    },
  });
}
