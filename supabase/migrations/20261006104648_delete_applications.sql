-- C5: verwijderen op verzoek (AVG, recht op vergetelheid).
--  * Alleen de eigenaar van een kantoor mag een aanvraag van dat kantoor verwijderen (rijafscherming).
--  * Het logboek van de aanvraag verdwijnt mee (on delete cascade).
--  * Elke verwijdering komt in `deletion_log`, zonder persoonsgegevens: alleen interne id, kantoor, wie en wanneer.
--    Ook de nachtelijke bewaartaak en handmatige SQL-verwijderingen worden zo vastgelegd (method = 'systeem').
-- Terugdraaien: drop trigger applications_log_delete; drop function private.applications_log_delete();
--   drop policy "eigenaar mag aanvragen verwijderen"; revoke delete on public.applications from authenticated;
--   drop table public.deletion_log;

create table public.deletion_log (
  id bigint generated always as identity primary key,
  application_id uuid not null,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  deleted_by uuid references auth.users (id) on delete set null,
  method text not null check (method in ('gebruiker', 'systeem')),
  deleted_at timestamptz not null default now()
);
comment on table public.deletion_log is 'Bewijs dat een aanvraag is verwijderd. Bevat bewust geen persoonsgegevens. method = systeem: bewaartaak of beheerder via SQL.';

create index deletion_log_org_idx on public.deletion_log (organization_id, deleted_at desc);
create index deletion_log_deleted_by_idx on public.deletion_log (deleted_by);

alter table public.deletion_log enable row level security;
revoke all on public.deletion_log from public, anon, authenticated;
grant select on public.deletion_log to authenticated;
grant all on public.deletion_log to service_role;

create policy "verwijderlog van eigen kantoor lezen" on public.deletion_log
  for select to authenticated
  using (organization_id in (select organization_id from public.members where user_id = (select auth.uid())));

grant delete on public.applications to authenticated;

create policy "eigenaar mag aanvragen verwijderen" on public.applications
  for delete to authenticated
  using (exists (
    select 1 from public.members m
    where m.organization_id = applications.organization_id
      and m.user_id = (select auth.uid())
      and m.role = 'owner'
  ));

create function private.applications_log_delete() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.deletion_log (application_id, organization_id, deleted_by, method)
  values (old.id, old.organization_id, auth.uid(), case when auth.uid() is null then 'systeem' else 'gebruiker' end);
  return null;
end $$;

create trigger applications_log_delete after delete on public.applications
  for each row execute function private.applications_log_delete();
