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

  // Create user with invite (they'll get an email to set their password)
  const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
    email,
    email_confirm: false,
    user_metadata: { name },
  });

  if (createError) {
    console.error("[create-staff] Failed to create user:", createError.message);
    return NextResponse.json(
      { error: `Failed to create user: ${createError.message}` },
      { status: 500 }
    );
  }

  if (!newUser?.user) {
    return NextResponse.json({ error: "User creation returned no user" }, { status: 500 });
  }

  // 4. Upsert profile (the trigger may have already created one, so upsert)
  const { error: profileError } = await serviceClient
    .from("profiles")
    .upsert({
      id: newUser.user.id,
      name,
      role: "staff",
      phone: phone || null,
      rate_per_hour: rate_per_hour || null,
    });

  if (profileError) {
    console.error("[create-staff] Profile upsert failed:", profileError.message);
    // User was created but profile failed — not ideal but not fatal
    // The auto-trigger should have created a basic profile
  }

  // 5. Send invite email so they can set their password
  const { error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email);
  if (inviteError) {
    console.error("[create-staff] Invite email failed:", inviteError.message);
    // User exists but invite didn't send — admin can re-invite later
  }

  return NextResponse.json({
    success: true,
    user: {
      id: newUser.user.id,
      email,
      name,
      role: "staff",
    },
  });
}
