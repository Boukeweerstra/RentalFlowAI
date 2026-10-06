-- H1: woningen met hun eisen, beheerd door de makelaar in het dashboard (scherm "Woningen").
--  * Het formulier voor woningzoekers leest hieruit (met terugval op de tenant-JSON-bestanden).
--  * Lezen: leden van het eigen kantoor. Schrijven: alleen de server (service_role), na controle dat de gebruiker eigenaar is
--    en na validatie van de eisen (criteriaSchema). De database laat de browser dus nooit rechtstreeks eisen wijzigen.
--  * Oude aanvragen blijven ongemoeid: de uitkomst van de eerste check staat per aanvraag vast.
-- Terugdraaien: drop table public.properties; (het formulier valt dan terug op de JSON-bestanden)

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id text not null check (property_id ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$'),
  address text not null check (char_length(address) between 3 and 160),
  rent numeric not null check (rent > 0 and rent <= 100000),
  available_from date,
  criteria jsonb not null,
  documents_later text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  unique (organization_id, property_id)
);
comment on table public.properties is 'Woning en eisen per kantoor. property_id is het id uit het systeem van de makelaar en wordt in de widget gebruikt (data-property-id).';
comment on column public.properties.criteria is 'Criteria zoals criteriaSchema in de app (incl. severity en incomeMarginPercent). Wordt door de server gevalideerd voor het opgeslagen wordt.';

create index properties_updated_by_idx on public.properties (updated_by);

create function private.properties_before_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger properties_before_update before update on public.properties
  for each row execute function private.properties_before_update();

alter table public.properties enable row level security;
revoke all on public.properties from public, anon, authenticated;
grant select on public.properties to authenticated;
grant all on public.properties to service_role;

create policy "woningen van eigen kantoor lezen" on public.properties
  for select to authenticated
  using (organization_id in (select organization_id from public.members where user_id = (select auth.uid())));
