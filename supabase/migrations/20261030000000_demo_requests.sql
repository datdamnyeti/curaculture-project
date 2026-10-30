-- Demo requests from the public landing page.
-- Written only by the /api/demo-request route with the service role; no one
-- else can read or write them (row level security on, no policies).

create table public.demo_requests (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  email       text not null check (char_length(email) between 3 and 254),
  clinic      text not null check (char_length(clinic) between 1 and 160),
  team_size   text check (team_size in ('Under 10', '10–30', '31–60', 'More than 60', 'Several clinics')),
  status      text not null default 'new' check (status in ('new', 'contacted', 'booked', 'closed')),
  created_at  timestamptz not null default now()
);

alter table public.demo_requests enable row level security;  -- no policies: service role only

grant select, insert, update on public.demo_requests to service_role;
