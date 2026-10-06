-- Indexen op de sleutels van het logboek (aanbeveling van de prestatiecontrole van Supabase).
create index if not exists application_events_organization_idx on public.application_events (organization_id);
create index if not exists application_events_actor_idx on public.application_events (actor) where actor is not null;
