-- v2.2 pilot owner tools: practice vitals, exit records, onboarding checklists,
-- client-conduct policy audits and stay-interview themes.
--
-- These describe the clinic, not anyone's survey answers, so they are not
-- covered by the 5-response rule. Nothing here links to a survey response.
-- Writes go through API routes with the service role; clinic members can read
-- their own clinic's rows.

-- Quarterly vitals (VT1–VT6). Role-keyed counts live in jsonb keyed R1–R6.
create table public.practice_vitals (
  id                 uuid primary key default gen_random_uuid(),
  clinic_id          uuid not null references public.clinics (id) on delete cascade,
  quarter            text not null check (quarter ~ '^[0-9]{4}-Q[1-4]$'),
  headcount          jsonb not null default '{}'::jsonb,   -- VT1
  fte                jsonb not null default '{}'::jsonb,   -- VT2
  hires              jsonb not null default '{}'::jsonb,   -- VT3
  exits_confirmed    boolean not null default true,        -- VT4: exits are counted from exit_records
  open_positions     jsonb not null default '[]'::jsonb,   -- VT5: [{ "role": "R2", "since": "2026-03-02" }]
  after_hours_shifts integer check (after_hours_shifts >= 0),  -- VT6, null = not tracked
  overtime_hours     integer check (overtime_hours >= 0),      -- VT6, null = not tracked
  entered_by         uuid references auth.users (id),
  updated_at         timestamptz not null default now(),
  unique (clinic_id, quarter)
);

-- One record per leaver (XR1–XR9). Role and month only: no name.
-- A record with only last_day and role is a separation still to be coded.
create table public.exit_records (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references public.clinics (id) on delete cascade,
  last_day        date not null,                                         -- XR1 (month is what is reported)
  role            text not null check (role in ('R1','R2','R3','R4','R5','R6')),  -- XR2
  started_month   date,                                                  -- XR3
  initiated_by    smallint check (initiated_by in (1, 2, 3, 4)),         -- XR4
  main_reason     text check (main_reason in ('01','02','03','04','05','06','07','08','09','10','20','21','22','23','24','99')),  -- XR5
  other_reasons   text[] not null default '{}' check (cardinality(other_reasons) <= 2),  -- XR6
  destination     smallint check (destination in (1, 2, 3, 4, 5, 9)),     -- XR7
  reason_source   smallint check (reason_source in (1, 2, 3, 9)),        -- XR8
  would_rehire    smallint check (would_rehire in (1, 2, 3)),            -- XR9
  coded_at        timestamptz,
  created_at      timestamptz not null default now()
);
create index exit_records_clinic_idx on public.exit_records (clinic_id, last_day);

-- Onboarding checklist per new hire (OC1–OC14). steps: { "OC1": 2, ... }
-- 2 done on time, 1 late or partly, 0 not done, 8 does not apply; absent = not recorded.
create table public.new_hires (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinics (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 120),
  role        text not null check (role in ('R1','R2','R3','R4','R5','R6')),
  start_date  date not null,
  left_on     date,
  steps       jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index new_hires_clinic_idx on public.new_hires (clinic_id, start_date);

-- Client-conduct policy audit (CP1–CP15). answers: { "CP1": 2, ..., "CP8": 0-3 }
create table public.policy_audits (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinics (id) on delete cascade,
  audited_on  date not null,
  reason      text not null check (reason in ('yearly', 'incident')),
  answers     jsonb not null,
  created_at  timestamptz not null default now()
);

-- Stay interviews: themes only (area ids). Never names, quotes or who said what.
create table public.stay_interview_themes (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinics (id) on delete cascade,
  held_on     date not null,
  trigger     text not null check (trigger in ('opening_90', 'two_exits', 'new_hire', 'other')),
  themes      text[] not null check (cardinality(themes) between 1 and 8
                and themes <@ array['TC','WR','FL','TE','PM','GD','ES','CR']),
  created_at  timestamptz not null default now()
);

alter table public.practice_vitals       enable row level security;
alter table public.exit_records          enable row level security;
alter table public.new_hires             enable row level security;
alter table public.policy_audits         enable row level security;
alter table public.stay_interview_themes enable row level security;

create policy practice_vitals_member_read on public.practice_vitals
  for select to authenticated using (public.cc_is_member(clinic_id));
create policy exit_records_member_read on public.exit_records
  for select to authenticated using (public.cc_is_member(clinic_id));
create policy new_hires_member_read on public.new_hires
  for select to authenticated using (public.cc_is_member(clinic_id));
create policy policy_audits_member_read on public.policy_audits
  for select to authenticated using (public.cc_is_member(clinic_id));
create policy stay_interview_themes_member_read on public.stay_interview_themes
  for select to authenticated using (public.cc_is_member(clinic_id));

grant select on public.practice_vitals, public.exit_records, public.new_hires,
  public.policy_audits, public.stay_interview_themes to authenticated;
grant select, insert, update, delete on public.practice_vitals, public.exit_records, public.new_hires,
  public.policy_audits, public.stay_interview_themes to service_role;
