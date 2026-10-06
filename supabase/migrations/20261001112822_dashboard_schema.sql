-- Stap 1: schoon schema voor het makelaarsdashboard.
--
-- Vier tabellen: kantoren, wie bij welk kantoor hoort, aanvragen, en een logboek.
-- Alleen de server (service_role) voegt aanvragen toe. Een ingelogde makelaar leest de aanvragen van
-- zijn eigen kantoor en mag precies vier kolommen wijzigen. Anonieme bezoekers hebben geen toegang.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Tabellen
-- ---------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null unique check (tenant_key ~ '^[a-z0-9][a-z0-9-]{0,63}$'),
  name text not null check (length(name) between 1 and 200),
  notify_email text,
  retention_months integer not null default 6 check (retention_months between 1 and 120),
  created_at timestamptz not null default now()
);
comment on table public.organizations is 'Een makelaarskantoor (tenant). tenant_key komt overeen met tenantId in de app.';

create table public.members (
  user_id uuid not null references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now(),
  primary key (user_id, organization_id)
);
comment on table public.members is 'Wie bij welk kantoor hoort. Nu één login per kantoor; meerdere medewerkers kan later zonder ombouw.';

create table public.applications (
  id uuid primary key,
  organization_id uuid not null references public.organizations (id) on delete cascade,

  property_id text not null,
  property_address text not null,
  rent numeric(10, 2) not null check (rent > 0),
  property_source text not null check (property_source in ('config', 'widget_hints')),
  lang text not null check (lang in ('nl', 'en')),

  name text not null,
  email text not null,
  phone text not null,

  applicants smallint not null check (applicants between 1 and 4),
  occupants smallint not null check (occupants between 1 and 20),
  total_income numeric(12, 2) not null check (total_income >= 0),
  income_required numeric(12, 2),

  precheck_status text not null check (precheck_status in ('suitable', 'review', 'unsuitable')),
  precheck_reasons text[] not null default '{}',

  group_current text not null check (group_current in ('suitable', 'review', 'unsuitable')),
  handling_status text not null default 'nieuw'
    check (handling_status in ('nieuw', 'benaderd', 'bezichtiging_gepland', 'afgerond')),
  contacted_at timestamptz,
  note text not null default '' check (length(note) <= 5000),

  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.applications is 'Een woningaanvraag. precheck_* is de onveranderlijke uitkomst van de regels; group_current is de keuze van de makelaar.';
comment on column public.applications.payload is 'De volledige gestructureerde aanvraag (Application) zoals de app die naar Make stuurt.';

create table public.application_events (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.applications (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor uuid references auth.users (id) on delete set null,
  action text not null
    check (action in ('created', 'group_changed', 'handling_status_changed', 'note_changed', 'contacted')),
  from_value text,
  to_value text,
  created_at timestamptz not null default now()
);
comment on table public.application_events is 'Logboek: wie deed wat en wanneer. actor is leeg bij het systeem. De tekst van notities wordt niet gelogd.';

create index applications_org_group_created_idx on public.applications (organization_id, group_current, created_at desc);
create index applications_created_idx on public.applications (created_at);
create index application_events_application_idx on public.application_events (application_id, created_at);
create index members_org_idx on public.members (organization_id);

-- ---------------------------------------------------------------------------
-- Triggers (functies staan in het niet-gepubliceerde schema `private`)
-- ---------------------------------------------------------------------------

create function private.applications_before_insert() returns trigger
language plpgsql set search_path = '' as $$
begin
  -- De makelaar begint met de uitkomst van de regels.
  new.group_current := coalesce(new.group_current, new.precheck_status);
  return new;
end $$;

create function private.applications_before_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  -- Wie de behandelstatus op "benaderd" zet, heeft de aanvrager benaderd.
  if new.handling_status = 'benaderd' and new.contacted_at is null
     and old.handling_status is distinct from 'benaderd' then
    new.contacted_at := now();
  end if;
  return new;
end $$;

create function private.applications_log_events() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  who uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    insert into public.application_events (application_id, organization_id, actor, action, to_value)
    values (new.id, new.organization_id, null, 'created', new.precheck_status);
    return null;
  end if;

  if new.group_current is distinct from old.group_current then
    insert into public.application_events (application_id, organization_id, actor, action, from_value, to_value)
    values (new.id, new.organization_id, who, 'group_changed', old.group_current, new.group_current);
  end if;
  if new.handling_status is distinct from old.handling_status then
    insert into public.application_events (application_id, organization_id, actor, action, from_value, to_value)
    values (new.id, new.organization_id, who, 'handling_status_changed', old.handling_status, new.handling_status);
  end if;
  if new.note is distinct from old.note then
    insert into public.application_events (application_id, organization_id, actor, action)
    values (new.id, new.organization_id, who, 'note_changed');
  end if;
  if (new.contacted_at is null) is distinct from (old.contacted_at is null) then
    insert into public.application_events (application_id, organization_id, actor, action, to_value)
    values (new.id, new.organization_id, who, 'contacted', case when new.contacted_at is null then 'nee' else 'ja' end);
  end if;
  return null;
end $$;

create trigger applications_before_insert before insert on public.applications
  for each row execute function private.applications_before_insert();
create trigger applications_before_update before update on public.applications
  for each row execute function private.applications_before_update();
create trigger applications_log_events after insert or update on public.applications
  for each row execute function private.applications_log_events();

-- ---------------------------------------------------------------------------
-- Rechten: alles dicht, daarna precies open wat nodig is
-- ---------------------------------------------------------------------------

revoke all on public.organizations, public.members, public.applications, public.application_events
  from public, anon, authenticated;

grant select on public.organizations, public.members, public.applications, public.application_events
  to authenticated;
-- De makelaar mag alleen deze vier kolommen wijzigen; contact, inkomen en de eerste check zijn alleen te lezen.
grant update (group_current, handling_status, contacted_at, note) on public.applications to authenticated;

grant all on public.organizations, public.members, public.applications, public.application_events
  to service_role;

-- ---------------------------------------------------------------------------
-- Rijafscherming: een gebruiker ziet alleen zijn eigen kantoor
-- ---------------------------------------------------------------------------

alter table public.organizations      enable row level security;
alter table public.members            enable row level security;
alter table public.applications       enable row level security;
alter table public.application_events enable row level security;

create policy "eigen kantoor lezen" on public.organizations
  for select to authenticated
  using (id in (select organization_id from public.members where user_id = (select auth.uid())));

create policy "eigen lidmaatschap lezen" on public.members
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "aanvragen van eigen kantoor lezen" on public.applications
  for select to authenticated
  using (organization_id in (select organization_id from public.members where user_id = (select auth.uid())));

create policy "aanvragen van eigen kantoor bijwerken" on public.applications
  for update to authenticated
  using (organization_id in (select organization_id from public.members where user_id = (select auth.uid())))
  with check (organization_id in (select organization_id from public.members where user_id = (select auth.uid())));

create policy "logboek van eigen kantoor lezen" on public.application_events
  for select to authenticated
  using (organization_id in (select organization_id from public.members where user_id = (select auth.uid())));

-- ---------------------------------------------------------------------------
-- Live bijwerken in het dashboard (Realtime volgt dezelfde rijafscherming)
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.applications;
