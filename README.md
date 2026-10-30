# CuraCulture

Workplace culture survey platform for veterinary clinics. This branch builds the
core loop on **instrument v2.1**: a clinic adds its team, sends the survey,
staff answer from a personal link, and the clinic sees results under the v2.1
analysis rules.

## What's here

| Piece | Where |
|---|---|
| Instrument v2.1: 41 questions, fixed page order, exact wording and codes | `src/lib/instrument/v21.ts` |
| Scoring: reverse items, area scores, distributions, % favorable, groups of 5+ | `src/lib/scoring.ts` |
| Database schema, row level security, survey functions | `supabase/migrations/` |
| Survey link loop (create, load, save draft, submit, counts, results) | `src/lib/server/surveyService.ts` |
| Email (Resend) and text (Twilio) delivery | `src/lib/server/notify.ts`, `deliver.ts` |
| Staff survey page | `src/pages/s/[token].tsx` |
| Owner app: surveys, results, team, settings | `src/pages/app/` |
| Sign-in, landing page (design J), staff privacy page | `src/pages/login.tsx`, `index.tsx`, `privacy.tsx` |
| Logo (stage ring) and wordmark | `src/components/brand/Logo.tsx`, `public/logo.svg` |
| "Book a demo" requests from the landing page | `src/pages/api/demo-request.ts`, `src/lib/demoRequest.ts`, `demo_requests` table |
| API routes | `src/pages/api/` |
| Tests, including SQL tests on real Postgres (PGlite) | `tests/` |

## The anonymity firewall

* **Invitations** record who was asked, how the link was sent, and a status
  (not started, in progress, complete). **Responses** record answers by item ID.
  The two tables share no key, and responses carry no token, invitation ID,
  employee ID or timestamp.
* Raw survey tokens are never stored. Each token is an HMAC of the invitation
  ID with `SURVEY_TOKEN_SECRET`, so reminders can rebuild the same link; the
  database keeps only `sha256(token)`.
* Submitting writes the response and then marks the invitation complete, in
  one transaction (`cc_submit_response`). Drafts live on the invitation only
  while in progress and are deleted on submit or when a survey closes.
* Staff never authenticate. Invitations and responses have row level security
  with no policies, so only the service role, through the `cc_*` SQL functions,
  can read or write them.
* Results return only at 5 or more responses (`cc_campaign_responses` refuses a
  lower minimum). Group comparisons are hidden unless every group has 5 or more.
  Owners see completion counts, never who is outstanding.

## Analysis rules (v2.1 brief)

No overall score, no red/amber/green bands. Every area and item shows its
distribution on the 1–6 scale. Reverse items (TC1, WR2, GD3) are recoded
`7 - code` before anything else. Supplementary items (S1–S3) and intent to
leave (IL1–IL3) are reported separately. Written answers reach owners only as
researcher-approved quotes, or not at all in self-serve clinics.

## Look and feel

Design J: Geist and Geist Mono (the `geist` package, loaded with `next/font`), near-black
text on white and pale grey, and one brand colour (`brand`, #1b6984) for buttons, links and
highlights. The six-step response scale colours are used only inside results. The logo is a
ring of four arcs for the pathway's stages: Measure, Plan, Change, Sustain.

## Run it locally

1. Create a Supabase project (or run `supabase start` with the Supabase CLI).
2. Apply the migrations: `supabase db push`, or paste each file in
   `supabase/migrations/` into the SQL editor, oldest first.
3. In Supabase → Authentication → URL configuration, add
   `http://localhost:3000/app` and `http://localhost:3000/login` as redirect URLs.
4. `cp .env.example .env.local` and fill in the Supabase keys and a
   `SURVEY_TOKEN_SECRET` (`openssl rand -base64 48`). Leave the email and text
   keys blank to log messages to the terminal instead of sending them.
5. `npm install` then `npm run dev`, open http://localhost:3000, create an
   account, set up the clinic, add at least 5 people, and send a survey. The
   survey links print in the terminal.

## Checks

```bash
npm test          # instrument, scoring, validation, and the full loop on Postgres
npx tsc --noEmit
npm run lint
npm run build
```

## Not built yet

* Researcher screening of written answers (owners only see quotes marked
  `approved` in `responses.open_ended`).
* Shared QR code for staff with neither an email nor a mobile number (they are
  listed as unreachable when a survey is sent).
* Plans, action cards, the resource library, the 90-day pulse and re-survey
  comparison, the weekly digest, multi-user invitations.
* Scheduled automatic reminders (reminders are sent from the survey page).
