# Conscious Speech Strategies — Claude Context

## Project Overview
Holistic speech therapy practice website + admin dashboard for Rachel Degani, based in Gulfport, FL.
- **Public site**: marketing pages, camp registration, private services intake
- **Admin dashboard**: student management, session logging, hours tracking, invoicing, SMS, payments

## Live URLs
- Production: https://consciousspeech.net / https://www.consciousspeech.net
- Admin: https://www.consciousspeech.net/admin
- Vercel project: `consciousspeechnet-1358s-projects/conscious-speech-strategies`
- GitHub: https://github.com/consciousspeech/conscious-speech-strategies

## Tech Stack
- **Framework**: Next.js 16 (Turbopack, App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design tokens
- **Database/Auth**: Supabase (`fokfhnbvogtwopsudnwh.supabase.co`)
- **Payments**: Stripe
- **SMS**: Twilio
- **AI**: Anthropic API (used in SMS parsing)
- **Deployment**: Vercel (auto-deploys on push to `main`)

## Deployment Workflow
GitHub is connected to Vercel — **push to GitHub and it auto-deploys**. No manual Vercel step needed.

```powershell
# Make changes, then:
git add <files>
git commit -m "description"
git push origin master:main   # local branch is master, remote is main
```

### Tooling notes (Windows)
Node/npm are not in the default PowerShell PATH. If you need the Vercel CLI manually:
```powershell
$env:PATH = "C:\Program Files\nodejs;$env:APPDATA\npm;$env:PATH"
vercel --prod --yes
```
Git identity is set at repo level:
- `user.email = consciousspeech.net@gmail.com`
- `user.name = Conscious Speech`

## Project Structure
```
src/
  app/
    page.tsx              # Homepage (public)
    admin/                # Full admin dashboard (auth-protected)
      page.tsx            # Dashboard overview
      students/           # Student CRUD
      sessions/           # Session logging
      hours/              # Hours tracking
      invoices/           # Invoice management
      payments/           # Payment records
      schools/            # School management
      staff/              # Staff management
      sms-log/            # SMS conversation log
      export/             # Data export
      login/              # Auth
    camps/                # Camp registration pages
    services/             # Private services page
  components/
    Hero.tsx              # Homepage hero section
    Navigation.tsx        # Fixed top nav
  lib/
    sms/                  # Twilio/AI SMS parsing
```

## Design System (Tailwind custom tokens)
| Token | Use |
|-------|-----|
| `bg-cream` / `text-cream` | Main background |
| `text-charcoal` / `text-charcoal-light` | Primary text |
| `bg-sage` / `text-sage-dark` | Brand teal-green (CTA buttons, accents) |
| `bg-peach` | Warm accent circles |
| `bg-olive` | Subtle decorative dots |
| `bg-warm-white` | Nav background on scroll |

Nav is `fixed` — hero and any full-page sections need `pt-20` (mobile) / `pt-24` (desktop) to clear it.

## Admin Dashboard Notes
- Auth is Supabase session-based; `/admin` redirects to `/admin/login` if unauthenticated
- Dashboard reads live data from Supabase on every load — no mock data
- SMS log at `/admin/sms-log` uses Twilio + Anthropic AI parser
- Export at `/admin/export` generates CSV/reports

## Environment Variables (set in Vercel)
| Variable | Scope |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | all |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | all |
| `NEXT_PUBLIC_SITE_URL` | all |
| `STRIPE_PRICE_ID` | all |
| `SUPABASE_SERVICE_ROLE_KEY` | production, preview |
| `STRIPE_SECRET_KEY` | production, preview |
| `ANTHROPIC_API_KEY` | production, preview |

## Key Things to Know
- **TODOS.md** has a live HIPAA compliance sprint and feature backlog — check it before adding features that touch student/health data
- The `middleware` file is deprecated in this Next.js version — use `proxy` convention instead (build will warn about this)
- Sensitive env vars (service role key, Stripe secret, Anthropic key) cannot be set for the `development` environment in Vercel — this is a Vercel restriction, not a bug
- When deploying, all 36 pages should generate cleanly — any Supabase connection error during static generation means an env var is missing
