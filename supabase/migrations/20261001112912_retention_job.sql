-- Stap 1b: bewaartermijn. Elke nacht worden aanvragen verwijderd die ouder zijn dan de bewaartermijn
-- van hun kantoor (standaard 6 maanden). Het logboek verdwijnt mee (on delete cascade).
--
-- Let op: dit raakt alleen de database. De Google Sheet en de mails bij de makelaar bewaren gegevens
-- apart en moeten apart worden opgeruimd.

create extension if not exists pg_cron with schema pg_catalog;

create function private.delete_expired_applications() returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  removed bigint;
begin
  with gone as (
    delete from public.applications a
    using public.organizations o
    where a.organization_id = o.id
      and a.created_at < now() - make_interval(months => o.retention_months)
    returning a.id
  )
  select count(*) into removed from gone;
  return removed;
end $$;

revoke all on function private.delete_expired_applications() from public, anon, authenticated;

-- Dagelijks om 03:15 (UTC). Vervangt een eerdere taak met dezelfde naam.
select cron.unschedule('delete-expired-applications')
 where exists (select 1 from cron.job where jobname = 'delete-expired-applications');
select cron.schedule(
  'delete-expired-applications',
  '15 3 * * *',
  $$ select private.delete_expired_applications(); $$
);
