-- E2: resultaten van AI-ondersteuning (samenvatting van de toelichting, later conceptmails).
--  * Alleen de server schrijft (service_role); de makelaar mag het eigen kantoor lezen.
--  * De AI adviseert: dit staat los van `applications`, zodat het de uitkomst van de regels nooit kan wijzigen.
--  * Bewaartermijn volgt de aanvraag (on delete cascade), dus ook verwijderen op verzoek en de bewaartaak ruimen dit op.
-- Terugdraaien: drop table public.ai_outputs;

create table public.ai_outputs (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.applications (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  kind text not null check (kind in ('summary', 'draft_mail')),
  status text not null check (status in ('ok', 'error')),
  content jsonb,
  model text not null,
  prompt_version text not null,
  input_tokens integer,
  output_tokens integer,
  error_code text,
  created_at timestamptz not null default now(),
  unique (application_id, kind, prompt_version)
);
comment on table public.ai_outputs is 'Hulpmiddel voor de makelaar, geen besluit. content bevat alleen door de AI gemaakte tekst; error_code bevat nooit invoer van de aanvrager.';

create index ai_outputs_org_idx on public.ai_outputs (organization_id);

alter table public.ai_outputs enable row level security;
revoke all on public.ai_outputs from public, anon, authenticated;
grant select on public.ai_outputs to authenticated;
grant all on public.ai_outputs to service_role;

create policy "ai-resultaten van eigen kantoor lezen" on public.ai_outputs
  for select to authenticated
  using (organization_id in (select organization_id from public.members where user_id = (select auth.uid())));
