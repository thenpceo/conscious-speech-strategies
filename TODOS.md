# TODOs — Conscious Speech Strategies

---

## HIPAA Compliance Sprint

All items below are required to make the system HIPAA-compliant (or as close as possible on a budget). Ordered by priority. Check off as completed.

### Account Ownership (do first — non-technical)
- [ ] Transfer Supabase project ownership to Rachel's email/org. Add WithLore team as collaborators.
- [ ] Transfer Vercel project ownership to Rachel. Add WithLore as collaborators.
- [ ] Rachel signs Supabase BAA (requires Pro plan, $25/mo)
- [ ] Rachel signs BAAs with Vercel, Stripe, Twilio (check each provider's BAA process)
- [ ] Rachel's lawyer drafts/reviews Privacy Policy (we provide plain-English data summary)
- [ ] Rachel completes annual HIPAA Risk Assessment (free HHS template)
- [ ] Rachel documents staff training on data handling (even a simple log with dates)

### P0: Rewrite RLS Policies (CRITICAL)
**What:** All tables currently allow any authenticated user full CRUD on all records. Rewrite to enforce role + school scoping.
**Rules to implement:**
- Staff can only read/write students at their assigned school(s)
- Staff can only read/write sessions, goals, hours for their own students
- Only admins can manage schools, staff, invoices, and SMS logs
- Remove all anonymous access policies from SMS tables
- Seed endpoint (`/api/seed`) restricted to admin role
- Import page (`/admin/students/import`) restricted to admin role
**Depends on:** May need a `staff_schools` junction table to map staff → school assignments.

### P0: Add Audit Logging (CRITICAL)
**What:** Create `audit_log` table tracking all access to student/health data.
**Fields:** `id`, `user_id`, `action` (select/insert/update/delete), `table_name`, `record_id`, `metadata` (jsonb), `ip_address`, `created_at`
**Implementation:** Database triggers on students, goals, sessions, session_goals, hours, sms_messages, sms_conversations tables. Also log admin actions (staff creation, data seeding) from API routes.
**Depends on:** Nothing — can do standalone.

### P0: Enable MFA (CRITICAL)
**What:** Enable Supabase TOTP-based MFA for all admin/staff users.
**Implementation:** Enable MFA in Supabase dashboard. Add MFA enrollment UI in admin settings. Add MFA challenge step to login flow. Require MFA for admin-role users at minimum.
**Depends on:** Nothing — Supabase has built-in TOTP support.

### P0: Fix Anonymous SMS Access (CRITICAL)
**What:** Remove anon RLS policies from `sms_messages` and `sms_conversations`. Use service role key in the Twilio webhook endpoint instead.
**Depends on:** Nothing — quick fix.

### ~~P1: Sanitize Login Error Messages~~ DONE
**What:** Replace specific auth errors ("User not found", "Invalid password") with generic message ("Invalid email or password"). Prevents email enumeration.
**Where:** `src/app/admin/login/page.tsx`

### P1: Add Session Timeout
**What:** Set idle session timeout to 30-60 minutes. Auto-logout inactive users.
**Where:** Supabase auth config + client-side idle detection.

### ~~P1: Secure CSV Import~~ DONE
**What:** Add file size limit (5MB), MIME type validation, clear parsed data from browser memory after import. Add admin-only access check.
**Where:** `src/app/admin/students/import/page.tsx`

### ~~P1: Add Security Headers~~ DONE
**What:** Add HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy headers.
**Where:** `next.config.ts`

### P1: Add Rate Limiting
**What:** Rate limit login attempts (5/min), password reset (3/min), and API endpoints.
**Where:** Middleware or Vercel WAF rules.

### P1: Secure Checkout Endpoint
**What:** The `/api/checkout` endpoint accepts parent PII without authentication. Either require auth or minimize PII stored in Stripe metadata (use reference IDs instead of names/emails).
**Where:** `src/app/checkout/route.ts`

### P2: Write Data Summary for Lawyer
**What:** Plain-English document describing: what data the app collects, where it's stored, who can access it, how long it's retained, and what third parties receive it (Supabase, Vercel, Stripe, Twilio, Anthropic). Hand this to Rachel's lawyer as the basis for a Privacy Policy.

### P2: Dependency Audit
**What:** Run `npm audit`, review `xlsx` library for known CVEs, set up Dependabot or similar for ongoing monitoring.

---

## P2: Smart Name Autocomplete (Effort: S)
**What:** When AI parses a name like "Jon Smth", fuzzy-match against the DB and reply "Did you mean John Smith at Gulf Coast Prep?"
**Why:** Reduces data entry errors from typos. Staff text casually and misspell names.
**Where to start:** `src/lib/sms/ai-parser.ts` — after AI returns a parsed name, query `students` table with trigram similarity (`pg_trgm`) and present the best match in the confirmation message.
**Depends on:** Core SMS system working, `pg_trgm` extension enabled in Supabase.

## P2: Weekly Hours Summary via SMS (Effort: M)
**What:** Automated Friday 5pm text to each staff member: "This week: 18.5 hours across 4 schools. Nice work!"
**Why:** Gives staff visibility into their weekly totals without opening the dashboard. Builds engagement.
**Where to start:** Create a cron-triggered endpoint (`/api/sms-cron/weekly-digest`) that queries `hours` table grouped by `user_id` for the current week, formats a summary, and sends outbound SMS via Twilio REST API.
**Depends on:** Outbound SMS infrastructure (Twilio client for sending, not just receiving).

## P3: Outbound Reminder System (Effort: L)
**What:** Text staff their schedule each morning ("You have Sarah at 2pm, Bay Point at 3:30pm").
**Why:** Reduces missed sessions and late arrivals. Natural extension of bi-directional SMS.
**Where to start:** Requires a scheduling/appointments table that doesn't exist yet. Design schema, build admin UI for scheduling, then wire up morning cron job.
**Depends on:** Scheduling data model, outbound SMS infrastructure, cron job system.
