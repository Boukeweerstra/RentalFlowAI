"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GROUPS,
  GROUP_META,
  HANDLINGS,
  HANDLING_LABEL,
  rowToDash,
  type ApplicationRow,
  type DashApplication,
  type DashEvent,
  type Group,
  type Handling,
} from "@/lib/dashboard/types";
import { nextStep } from "@/lib/dashboard/next-step";
import {
  PAGE_SIZE,
  SORT_LABEL,
  matchesQuery,
  matchesStatus,
  sortApplications,
  type SortKey,
  type StatusFilter,
} from "@/lib/dashboard/filter";
import { REASON_NL } from "@/lib/mail-texts";
import { getDict } from "@/lib/i18n";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import {
  deleteApplication,
  loadApplications,
  loadAiSummary,
  loadEvents,
  type AiSummary,
  updateApplication,
  type ApplicationPatch,
} from "@/app/dashboard/actions";

type Props = {
  initial: DashApplication[];
  /** Aanvraag die direct moet openstaan (link uit de mail). */
  focusId?: string;
  /** Kantoornamen, alleen getoond als de gebruiker bij meer dan één kantoor hoort. */
  organizations: Record<string, string>;
  /** Voorbeeldmodus (alleen lokaal): geen server, geen live bijwerken, nep-gegevens. */
  preview?: boolean;
  previewEvents?: Record<string, DashEvent[]>;
};

const ALL = "__all__";
const incomeTypes = getDict("nl").incomeTypes as Record<string, string>;

// ---------------------------------------------------------------------------
// Kleine hulpfuncties
// ---------------------------------------------------------------------------

const euro = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const dateTime = (iso: string) =>
  new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(iso));

const dateOnly = (iso: string) =>
  new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Amsterdam" }).format(
    new Date(iso),
  );

function relative(iso: string, now: number): string {
  const min = Math.round((now - new Date(iso).getTime()) / 60000);
  if (min < 1) return "zojuist";
  if (min < 60) return `${min} min geleden`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `${hours} uur geleden`;
  const days = Math.round(hours / 24);
  return days === 1 ? "gisteren" : `${days} dagen geleden`;
}

const yesNo = (v: boolean | null) => (v === null ? "Niet gevraagd" : v ? "Ja" : "Nee");

function describeEvent(e: DashEvent): string {
  const who = e.bySystem ? "Systeem" : e.byMe ? "Jij" : "Een collega";
  const handling = (v: string | null) => (v && v in HANDLING_LABEL ? HANDLING_LABEL[v as Handling] : (v ?? ""));
  const group = (v: string | null) => (v && v in GROUP_META ? GROUP_META[v as Group].title : (v ?? ""));
  switch (e.action) {
    case "created":
      return `${who}: aanvraag ontvangen, eerste check: ${group(e.toValue)}`;
    case "group_changed":
      return `${who}: groep van ${group(e.fromValue)} naar ${group(e.toValue)}`;
    case "handling_status_changed":
      return `${who}: status van ${handling(e.fromValue)} naar ${handling(e.toValue)}`;
    case "note_changed":
      return `${who}: notitie bijgewerkt`;
    case "contacted":
      return e.toValue === "ja" ? `${who}: als benaderd gemarkeerd` : `${who}: benaderd-markering weggehaald`;
  }
}

function upsert(list: DashApplication[], app: DashApplication): DashApplication[] {
  const rest = list.filter((a) => a.id !== app.id);
  return [app, ...rest].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ---------------------------------------------------------------------------
// Iconen (inline, decoratief)
// ---------------------------------------------------------------------------

const iconProps = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
const MailIcon = () => (<svg {...iconProps}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>);
const PhoneIcon = () => (<svg {...iconProps}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>);
const CopyIcon = () => (<svg {...iconProps}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></svg>);
const CheckIcon = () => (<svg {...iconProps}><path d="m5 12 5 5L20 7" /></svg>);
const ChevronIcon = ({ open }: { open: boolean }) => (<svg {...iconProps} width={16} height={16} style={{ transform: open ? "rotate(180deg)" : undefined }}><path d="m6 9 6 6 6-6" /></svg>);

// ---------------------------------------------------------------------------
// Tijd (eerst vast, na laden relatief; voorkomt hydratatie-verschillen)
// ---------------------------------------------------------------------------

function WhenText({ iso }: { iso: string }) {
  const [text, setText] = useState(() => dateTime(iso));
  useEffect(() => {
    const tick = () => setText(`${relative(iso, Date.now())} · ${dateTime(iso)}`);
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [iso]);
  return <time dateTime={iso}>{text}</time>;
}

// ---------------------------------------------------------------------------
// Contacttegel: grote, duidelijke mail- en telefoonknop met kopieerknop
// ---------------------------------------------------------------------------

function ContactTile({
  href, label, value, icon, copyLabel,
}: { href: string; label: string; value: string; icon: React.ReactNode; copyLabel: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="flex min-w-0 flex-1 basis-60 items-stretch overflow-hidden rounded-lg border border-zinc-400 bg-white">
      <a href={href}
        className="flex min-h-12 min-w-0 flex-1 items-center gap-3 px-3 py-2 hover:bg-zinc-50">
        <span className="shrink-0 text-zinc-700">{icon}</span>
        <span className="min-w-0">
          <span className="block text-xs text-zinc-700">{label}</span>
          <span className="block truncate text-base font-medium text-zinc-950">{value}</span>
        </span>
      </a>
      <button type="button" onClick={copy} aria-label={copyLabel}
        className="flex min-h-12 w-12 shrink-0 items-center justify-center border-l border-zinc-300 text-zinc-700 hover:bg-zinc-50">
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
      <span role="status" className="sr-only">{copied ? "Gekopieerd" : ""}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Eén aanvraag
// ---------------------------------------------------------------------------

type CardProps = {
  app: DashApplication;
  orgName?: string;
  /** Open/dicht staat in het bord, zodat een kaart open blijft als hij naar een andere groep verhuist. */
  open: boolean;
  onToggle: (id: string) => void;
  scrollIntoView?: boolean;
  busy: boolean;
  onPatch: (id: string, patch: ApplicationPatch, optimistic: Partial<DashApplication>) => void;
  onDelete: (id: string) => void;
  fetchEvents: (id: string) => Promise<DashEvent[] | null>;
  fetchSummary: (id: string) => Promise<AiSummary | null>;
};

function ApplicationCard({ app, orgName, open, onToggle, scrollIntoView = false, busy, onPatch, onDelete, fetchEvents, fetchSummary }: CardProps) {
  const [noteDraft, setNoteDraft] = useState(app.note);
  const [aiSummary, setAiSummary] = useState<AiSummary | null>(null);

  // De AI-samenvatting komt iets na de aanvraag binnen; ophalen zodra de kaart open gaat (alleen als er een toelichting is).
  useEffect(() => {
    if (!open || !app.motivation) return;
    let cancelled = false;
    fetchSummary(app.id).then((s) => { if (!cancelled) setAiSummary(s); });
    return () => { cancelled = true; };
  }, [open, app.id, app.motivation, fetchSummary]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [events, setEvents] = useState<DashEvent[] | null>(null);
  const [eventsError, setEventsError] = useState(false);

  // Een notitie die van buitenaf verandert (live bijwerken) overnemen. Tijdens het renderen bijwerken,
  // zoals React aanraadt, in plaats van met een effect.
  const [seenNote, setSeenNote] = useState(app.note);
  if (app.note !== seenNote) {
    setSeenNote(app.note);
    setNoteDraft(app.note);
  }

  // Geopend via de link in de mail: in beeld scrollen.
  useEffect(() => {
    if (scrollIntoView) document.getElementById(`app-${app.id}`)?.scrollIntoView({ block: "center" });
  }, [scrollIntoView, app.id]);

  // Het logboek laden en vernieuwen na een wijziging terwijl de kaart openstaat.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetchEvents(app.id).then((list) => {
      if (cancelled) return;
      setEvents(list);
      setEventsError(list === null);
    });
    return () => { cancelled = true; };
  }, [app.group, app.handling, app.note, app.contactedAt, open, fetchEvents, app.id]);

  const panelId = `details-${app.id}`;
  const telHref = `tel:${app.phone.replace(/[^+\d]/g, "")}`;
  const mailHref = `mailto:${app.email}?subject=${encodeURIComponent(`Uw aanvraag voor ${app.propertyAddress}`)}`;
  const initials = app.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const step = nextStep(app.group, app.precheckReasons, app.handling);
  const noteChanged = noteDraft !== app.note;
  const changedByMaker = app.group !== app.precheckStatus;

  return (
    <article id={`app-${app.id}`} aria-label={`Aanvraag van ${app.name}`}
      className="mb-3 rounded-xl border border-zinc-300 bg-white p-4">
      <div className="flex items-start gap-3">
        <div aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-medium text-zinc-800">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-zinc-950">
            {app.name}
            {app.handling === "nieuw" && (
              <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 align-middle text-xs font-medium text-blue-900">Nieuw</span>
            )}
          </h3>
          <p className="text-sm text-zinc-700">
            {app.propertyAddress}
            {orgName ? ` · ${orgName}` : ""} · <WhenText iso={app.createdAt} />
          </p>
        </div>
        <div className="shrink-0 text-right text-sm">
          <div className="font-medium text-zinc-950">{euro(app.totalIncome)}</div>
          <div className="text-zinc-700">
            {app.incomeRequired === null ? "geen inkomenseis" : `eis ${euro(app.incomeRequired)}`}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <ContactTile href={mailHref} label="E-mail" value={app.email} icon={<MailIcon />}
          copyLabel={`Kopieer het e-mailadres van ${app.name}`} />
        <ContactTile href={telHref} label="Telefoon" value={app.phone} icon={<PhoneIcon />}
          copyLabel={`Kopieer het telefoonnummer van ${app.name}`} />
      </div>

      {app.precheckReasons.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Redenen van de eerste check">
          {app.precheckReasons.map((r) => (
            <li key={r} className="rounded-md border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-sm text-zinc-800">
              {REASON_NL[r]}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-sm text-zinc-900">
        <span className="text-zinc-700">Volgende stap: </span>{step}
      </p>
      {changedByMaker && (
        <p className="mt-1 text-xs text-zinc-700">
          De regels stelden voor: {GROUP_META[app.precheckStatus].title}. Jij koos: {GROUP_META[app.group].title}.
        </p>
      )}

      <button type="button" onClick={() => onToggle(app.id)} aria-expanded={open} aria-controls={panelId}
        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium text-zinc-900 underline-offset-2 hover:underline">
        Details en acties <ChevronIcon open={open} />
      </button>

      {open && (
        <div id={panelId} className="mt-2 space-y-5 border-t border-zinc-200 pt-4">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div><dt className="text-zinc-700">Huishouden</dt><dd>{app.applicants} aanvrager(s), {app.occupants} bewoner(s)</dd></div>
            <div><dt className="text-zinc-700">Inkomstenbron</dt><dd>{app.primaryIncomeType ? (incomeTypes[app.primaryIncomeType] ?? app.primaryIncomeType) : "Onbekend"}</dd></div>
            <div><dt className="text-zinc-700">Gewenste start</dt><dd>{app.startDate ? dateOnly(app.startDate) : "Onbekend"}</dd></div>
            <div><dt className="text-zinc-700">Gewenste huurperiode</dt><dd>{app.leaseMonths ? `${app.leaseMonths} maanden` : "Onbekend"}</dd></div>
            <div><dt className="text-zinc-700">Huisdieren</dt><dd>{yesNo(app.hasPets)}</dd></div>
            <div><dt className="text-zinc-700">Woningdelers</dt><dd>{yesNo(app.hasHousemates)}</dd></div>
            <div><dt className="text-zinc-700">Garantsteller beschikbaar</dt><dd>{yesNo(app.guarantorAvailable)}</dd></div>
            <div><dt className="text-zinc-700">Huurprijs</dt><dd>{euro(app.rent)} per maand</dd></div>
            {app.motivation && (
              <div className="sm:col-span-2"><dt className="text-zinc-700">Toelichting van de aanvrager</dt><dd className="whitespace-pre-wrap">{app.motivation}</dd></div>
            )}
            {app.motivation && aiSummary && (
              <div className="sm:col-span-2 rounded-md border border-zinc-300 bg-zinc-50 p-3">
                <dt className="text-zinc-800">Samenvatting van de toelichting <span className="text-xs text-zinc-700">(AI-hulpmiddel, kan fouten bevatten; lees de originele tekst hierboven)</span></dt>
                <dd>
                  <p>{aiSummary.summary}</p>
                  {aiSummary.points.length > 0 && (
                    <ul className="mt-1 list-disc pl-5">
                      {aiSummary.points.map((p) => (<li key={p}>{p}</li>))}
                    </ul>
                  )}
                  <p className="mt-1 text-xs text-zinc-700">Dit beïnvloedt de groep niet; die komt alleen uit de regels en uw eigen keuze.</p>
                </dd>
              </div>
            )}
          </dl>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`group-${app.id}`} className="block text-sm font-medium">Groep</label>
              <select id={`group-${app.id}`} value={app.group} disabled={busy}
                onChange={(e) => onPatch(app.id, { group: e.target.value }, { group: e.target.value as Group })}
                className="mt-1 block min-h-11 w-full rounded-md border border-zinc-500 bg-white px-3 text-base">
                {GROUPS.map((g) => (<option key={g} value={g}>{GROUP_META[g].title} ({GROUP_META[g].subtitle})</option>))}
              </select>
            </div>
            <div>
              <label htmlFor={`handling-${app.id}`} className="block text-sm font-medium">Behandelstatus</label>
              <select id={`handling-${app.id}`} value={app.handling} disabled={busy}
                onChange={(e) => onPatch(app.id, { handling: e.target.value }, { handling: e.target.value as Handling })}
                className="mt-1 block min-h-11 w-full rounded-md border border-zinc-500 bg-white px-3 text-base">
                {HANDLINGS.map((h) => (<option key={h} value={h}>{HANDLING_LABEL[h]}</option>))}
              </select>
            </div>
          </div>

          <label htmlFor={`contacted-${app.id}`} className="flex min-h-11 items-center gap-3 text-sm">
            <input id={`contacted-${app.id}`} type="checkbox" className="h-6 w-6" checked={app.contactedAt !== null} disabled={busy}
              onChange={(e) => {
                // Wie iemand benadert, wil niet langer "Nieuw" zien: zet die status mee op "Benaderd".
                const advance = e.target.checked && app.handling === "nieuw";
                onPatch(
                  app.id,
                  advance ? { contacted: true, handling: "benaderd" } : { contacted: e.target.checked },
                  {
                    contactedAt: e.target.checked ? new Date().toISOString() : null,
                    ...(advance ? { handling: "benaderd" as Handling } : {}),
                  },
                );
              }} />
            <span>
              Benaderd
              {app.contactedAt && <span className="text-zinc-700"> (op {dateTime(app.contactedAt)})</span>}
            </span>
          </label>

          <div>
            <label htmlFor={`note-${app.id}`} className="block text-sm font-medium">Notitie</label>
            <textarea id={`note-${app.id}`} rows={3} maxLength={5000} value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-500 bg-white px-3 py-2 text-base" />
            <button type="button" disabled={!noteChanged || busy}
              onClick={() => onPatch(app.id, { note: noteDraft }, { note: noteDraft })}
              className="mt-2 min-h-11 rounded-md border border-zinc-500 px-4 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50">
              Notitie opslaan
            </button>
          </div>

          <div>
            <h4 className="text-sm font-medium">Logboek</h4>
            {eventsError ? (
              <p className="mt-1 text-sm text-red-800">Het logboek kon niet worden geladen.</p>
            ) : events === null ? (
              <p className="mt-1 text-sm text-zinc-700">Laden…</p>
            ) : events.length === 0 ? (
              <p className="mt-1 text-sm text-zinc-700">Nog niets vastgelegd.</p>
            ) : (
              <ul className="mt-1 space-y-1 text-sm">
                {events.map((e) => (
                  <li key={e.id}><span className="text-zinc-700">{dateTime(e.createdAt)} · </span>{describeEvent(e)}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-zinc-200 pt-4">
            {!confirmDelete ? (
              <button type="button" onClick={() => setConfirmDelete(true)} disabled={busy}
                className="min-h-11 rounded-md border border-red-800 px-4 text-sm font-medium text-red-800 hover:bg-red-50 disabled:opacity-50">
                Aanvraag verwijderen…
              </button>
            ) : (
              <div role="group" aria-labelledby={`del-${app.id}`} className="rounded-md bg-red-50 p-3 text-sm text-red-950">
                <p id={`del-${app.id}`} className="font-medium">Definitief verwijderen?</p>
                <p className="mt-1">
                  De gegevens van {app.name} en het logboek worden uit het dashboard verwijderd. Dit kan niet ongedaan worden gemaakt.
                  De rij in de Google Sheet en de mail naar het kantoor blijven bestaan: verwijder die zelf ook.
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button type="button" onClick={() => onDelete(app.id)} disabled={busy}
                    className="min-h-11 rounded-md bg-red-800 px-4 font-medium text-white hover:bg-red-900 disabled:opacity-60">
                    Ja, definitief verwijderen
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)}
                    className="min-h-11 rounded-md border border-zinc-600 bg-white px-4 font-medium text-zinc-900 hover:bg-zinc-50">
                    Annuleren
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Het bord met de drie groepen
// ---------------------------------------------------------------------------

export default function DashboardBoard({ initial, focusId, organizations, preview = false, previewEvents }: Props) {
  const [apps, setApps] = useState<DashApplication[]>(initial);
  const [woning, setWoning] = useState(ALL);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [extra, setExtra] = useState<Record<Group, number>>({ suitable: 0, review: 0, unsuitable: 0 });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(focusId ? [focusId] : []));
  const toggleOpen = useCallback((id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [live, setLive] = useState(false);
  const multiOrg = Object.keys(organizations).length > 1;

  const properties = useMemo(() => {
    const seen = new Map<string, string>();
    apps.forEach((a) => seen.set(`${a.organizationId}|${a.propertyId}`, a.propertyAddress));
    return [...seen.entries()].map(([key, address]) => ({ key, address }));
  }, [apps]);

  const visible = useMemo(
    () =>
      sortApplications(
        apps.filter(
          (a) =>
            (woning === ALL || `${a.organizationId}|${a.propertyId}` === woning) &&
            matchesStatus(a, status) &&
            matchesQuery(a, query),
        ),
        sort,
      ),
    [apps, woning, status, query, sort],
  );
  const filtering = woning !== ALL || status !== "all" || query.trim() !== "";
  const resetExtra = () => setExtra({ suitable: 0, review: 0, unsuitable: 0 });

  // Live bijwerken (Supabase Realtime volgt dezelfde rijafscherming) met verversen als terugval.
  useEffect(() => {
    if (preview) return;
    const supabase = createBrowserSupabase();
    let active = true;
    const channel = supabase.channel("applications-live");
    (async () => {
      await supabase.auth.getSession();
      if (!active) return;
      channel
        .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, (payload) => {
          if (payload.eventType === "DELETE") {
            const id = (payload.old as { id?: string }).id;
            if (id) setApps((list) => list.filter((a) => a.id !== id));
            return;
          }
          setApps((list) => upsert(list, rowToDash(payload.new as unknown as ApplicationRow)));
        })
        .subscribe((status) => setLive(status === "SUBSCRIBED"));
    })();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [preview]);

  const refresh = useCallback(async () => {
    if (preview) return;
    const res = await loadApplications();
    if (res.ok) { setApps(res.data); setError(""); } else setError(res.error);
  }, [preview]);

  // Terugval: elke minuut verversen zolang live bijwerken niet verbonden is.
  useEffect(() => {
    if (preview || live) return;
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [preview, live, refresh]);

  async function patch(id: string, change: ApplicationPatch, optimistic: Partial<DashApplication>) {
    const before = apps.find((a) => a.id === id);
    if (!before) return;
    setApps((list) => list.map((a) => (a.id === id ? { ...a, ...optimistic } : a)));
    setSavingId(id);
    setNotice("");
    setError("");
    if (preview) {
      setSavingId(null);
      setNotice("Opgeslagen (voorbeeld, niets verstuurd)");
      return;
    }
    const res = await updateApplication(id, change);
    if (res.ok) {
      setApps((list) => list.map((a) => (a.id === id ? res.data : a)));
      setNotice("Opgeslagen");
    } else {
      setApps((list) => list.map((a) => (a.id === id ? before : a)));
      setError(res.error);
    }
    setSavingId(null);
  }

  async function remove(id: string) {
    setSavingId(id);
    setNotice("");
    setError("");
    if (preview) {
      setApps((list) => list.filter((a) => a.id !== id));
      setSavingId(null);
      setNotice("Verwijderd (voorbeeld, niets echt verwijderd)");
      return;
    }
    const res = await deleteApplication(id);
    if (res.ok) {
      setApps((list) => list.filter((a) => a.id !== id));
      setNotice("Aanvraag verwijderd. Verwijder ook de rij in de Google Sheet en de mail naar het kantoor.");
    } else {
      setError(res.error);
    }
    setSavingId(null);
  }

  const fetchSummary = useCallback(
    async (id: string): Promise<AiSummary | null> => {
      // Voorbeeld met verzonnen tekst, om het scherm te kunnen beoordelen zonder AI (de kaart vraagt dit alleen bij een toelichting).
      if (preview) return { summary: "Voorbeeldsamenvatting (verzonnen, geen echte AI).", points: ["Voorbeeld-aandachtspunt"], model: "voorbeeld" };
      const res = await loadAiSummary(id);
      return res.ok ? res.data : null;
    },
    [preview],
  );

  const fetchEvents = useCallback(
    async (id: string): Promise<DashEvent[] | null> => {
      if (preview) return previewEvents?.[id] ?? [];
      const res = await loadEvents(id);
      return res.ok ? res.data : null;
    },
    [preview, previewEvents],
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="zoek" className="block text-sm font-medium">Zoeken</label>
            <input id="zoek" type="search" value={query} placeholder="Naam, e-mail, telefoon of adres"
              onChange={(e) => { setQuery(e.target.value); resetExtra(); }}
              className="mt-1 block min-h-11 w-full min-w-60 rounded-md border border-zinc-500 bg-white px-3 text-base" />
          </div>
          <div>
            <label htmlFor="woning-filter" className="block text-sm font-medium">Woning</label>
            <select id="woning-filter" value={woning} onChange={(e) => { setWoning(e.target.value); resetExtra(); }}
              className="mt-1 block min-h-11 w-full min-w-60 rounded-md border border-zinc-500 bg-white px-3 text-base">
              <option value={ALL}>Alle woningen</option>
              {properties.map((p) => (<option key={p.key} value={p.key}>{p.address}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium">Status</label>
            <select id="status-filter" value={status} onChange={(e) => { setStatus(e.target.value as StatusFilter); resetExtra(); }}
              className="mt-1 block min-h-11 w-full rounded-md border border-zinc-500 bg-white px-3 text-base">
              <option value="all">Alle statussen</option>
              <option value="open">Nog lopend (niet afgerond)</option>
              {HANDLINGS.map((h) => (<option key={h} value={h}>{HANDLING_LABEL[h]}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="sorteer" className="block text-sm font-medium">Sorteren</label>
            <select id="sorteer" value={sort} onChange={(e) => { setSort(e.target.value as SortKey); resetExtra(); }}
              className="mt-1 block min-h-11 w-full rounded-md border border-zinc-500 bg-white px-3 text-base">
              {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (<option key={k} value={k}>{SORT_LABEL[k]}</option>))}
            </select>
          </div>
          {filtering && (
            <button type="button" onClick={() => { setQuery(""); setWoning(ALL); setStatus("all"); resetExtra(); }}
              className="min-h-11 rounded-md border border-zinc-500 px-3 font-medium hover:bg-zinc-50">
              Filters wissen
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-zinc-700">
          <span>
            {preview ? "Voorbeeldmodus" : live ? "Live bijgewerkt" : "Ververst elke minuut"}
          </span>
          {!preview && (
            <button type="button" onClick={refresh}
              className="min-h-11 rounded-md border border-zinc-500 px-3 font-medium text-zinc-900 hover:bg-zinc-50">
              Nu verversen
            </button>
          )}
        </div>
      </div>

      <div aria-live="polite" className="min-h-6 text-sm">
        {notice && <p className="text-green-900">{notice}</p>}
      </div>
      {error && <p role="alert" className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      {GROUPS.map((g) => {
        const list = visible.filter((a) => a.group === g);
        const limit = PAGE_SIZE + extra[g];
        // De aanvraag uit de link in de mail blijft altijd zichtbaar, ook buiten de eerste pagina.
        const shown = list.filter((a, i) => i < limit || a.id === focusId);
        const headingId = `group-${g}`;
        return (
          <section key={g} aria-labelledby={headingId} className="mb-8">
            <h2 id={headingId} className="mb-3 flex flex-wrap items-baseline gap-2 text-lg font-semibold">
              {GROUP_META[g].title}
              <span className="text-sm font-normal text-zinc-700">{GROUP_META[g].subtitle}</span>
              <span className="ml-auto rounded-full bg-zinc-100 px-2.5 py-0.5 text-sm font-medium text-zinc-800">{list.length}</span>
            </h2>
            {list.length === 0 ? (
              <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-700">
                {filtering ? "Geen aanvragen in deze groep met deze filters." : "Geen aanvragen in deze groep."}
              </p>
            ) : (
              <>
                {shown.map((a) => (
                  <ApplicationCard key={a.id} app={a} open={openIds.has(a.id)} onToggle={toggleOpen}
                    scrollIntoView={a.id === focusId} busy={savingId === a.id} onPatch={patch} onDelete={remove}
                    fetchEvents={fetchEvents} fetchSummary={fetchSummary} orgName={multiOrg ? organizations[a.organizationId] : undefined} />
                ))}
                {list.length > limit && (
                  <button type="button" onClick={() => setExtra((e) => ({ ...e, [g]: e[g] + PAGE_SIZE }))}
                    className="min-h-11 w-full rounded-md border border-zinc-500 px-3 font-medium hover:bg-zinc-50">
                    Toon meer ({list.length - limit} overige)
                  </button>
                )}
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
