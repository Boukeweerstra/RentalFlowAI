-- Stap 0: oud prototype-schema opruimen, zonder iets te verwijderen.
--
-- Het project bevatte een groter, eerder ontwerp (18 tabellen voor e-mail, afspraken, herinneringen).
-- Dat gebruiken we niet. We verplaatsen alles naar het schema `archive_prototype`: omkeerbaar,
-- de gegevens blijven bestaan, en het schema is niet bereikbaar via de API (alleen `public` wordt
-- door PostgREST getoond). Terugzetten kan met `alter table ... set schema public`.

create schema if not exists archive_prototype;

-- 1. Tabellen (met hun beleidsregels, triggers en sleutels)
alter table public.ai_extractions        set schema archive_prototype;
alter table public.applicants            set schema archive_prototype;
alter table public.application_data      set schema archive_prototype;
alter table public.applications          set schema archive_prototype;
alter table public.appointment_slots     set schema archive_prototype;
alter table public.appointments          set schema archive_prototype;
alter table public.assessments           set schema archive_prototype;
alter table public.audit_logs            set schema archive_prototype;
alter table public.automation_rules      set schema archive_prototype;
alter table public.email_templates       set schema archive_prototype;
alter table public.email_threads         set schema archive_prototype;
alter table public.emails                set schema archive_prototype;
alter table public.integrations          set schema archive_prototype;
alter table public.notifications         set schema archive_prototype;
alter table public.organizations         set schema archive_prototype;
alter table public.properties            set schema archive_prototype;
alter table public.property_requirements set schema archive_prototype;
alter table public.users                 set schema archive_prototype;

-- 2. Typen
alter type public.application_category set schema archive_prototype;
alter type public.application_source   set schema archive_prototype;
alter type public.confidence_level     set schema archive_prototype;
alter type public.email_template_kind  set schema archive_prototype;
alter type public.integration_status   set schema archive_prototype;
alter type public.lifecycle_status     set schema archive_prototype;
alter type public.property_source      set schema archive_prototype;
alter type public.property_status      set schema archive_prototype;
alter type public.user_role            set schema archive_prototype;

-- 3. Functies mee (hun bodies verwijzen naar de verplaatste tabellen, dus het zoekpad volgt)
alter function public.auth_has_role(archive_prototype.user_role) set schema archive_prototype;
alter function public.auth_organization_id()                     set schema archive_prototype;
alter function public.auth_role()                                set schema archive_prototype;
alter function public.expire_stale_tokens()                      set schema archive_prototype;
alter function public.set_updated_at()                           set schema archive_prototype;

alter function archive_prototype.auth_has_role(archive_prototype.user_role) set search_path = archive_prototype, pg_catalog;
alter function archive_prototype.auth_organization_id()                     set search_path = archive_prototype, pg_catalog;
alter function archive_prototype.auth_role()                                set search_path = archive_prototype, pg_catalog;
alter function archive_prototype.expire_stale_tokens()                      set search_path = archive_prototype, extensions, pg_catalog;
alter function archive_prototype.set_updated_at()                           set search_path = pg_catalog;

-- 4. Niemand via de API bij het archief
revoke all on all tables    in schema archive_prototype from public, anon, authenticated;
revoke all on all sequences in schema archive_prototype from public, anon, authenticated;
revoke all on all functions in schema archive_prototype from public, anon, authenticated;
revoke all on schema archive_prototype from public, anon, authenticated;

-- 5. De automatische RLS-afscherming van nieuwe tabellen (event trigger `ensure_rls`) blijft werken,
--    maar de functie mag niet meer van buitenaf worden aangeroepen (/rest/v1/rpc/rls_auto_enable).
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
