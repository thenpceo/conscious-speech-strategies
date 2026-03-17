# TODOs — Conscious Speech Strategies

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
