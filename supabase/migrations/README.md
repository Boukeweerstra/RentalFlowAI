# Supabase-migraties

De bestandsnamen hebben dezelfde versienummers als in de database (`supabase_migrations.schema_migrations`), zodat repo en database overeenkomen.

| Versie | Naam | Doel |
|---|---|---|
| 20260922090000 | init | **Oud prototype**, niet in deze repo. Maakte de 18 tabellen die nu in `archive_prototype` staan. |
| 20260922090100 | rls | **Oud prototype**, niet in deze repo. Beleidsregels van die tabellen. |
| 20261001112650 | archive_old_prototype_schema | Verplaatst het oude schema naar `archive_prototype` (niets verwijderd). |
| 20261001112822 | dashboard_schema | Kantoren, leden, aanvragen, logboek, afscherming (RLS), rechten, triggers, Realtime. |
| 20261001112912 | retention_job | Nachtelijke taak: aanvragen ouder dan de bewaartermijn verwijderen. |
| 20261001113029 | events_fk_indexes | Indexen op het logboek. |

Nieuwe migraties: eerst als bestand hier toevoegen en daarna toepassen, en de versie die de database kiest overnemen in de bestandsnaam.
Gegevens zoals kantoren en leden (met e-mailadressen) staan bewust **niet** in een migratie; die zet je met een losse opdracht in de database.
