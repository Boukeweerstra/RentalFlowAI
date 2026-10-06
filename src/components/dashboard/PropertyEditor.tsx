"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import RequirementsPanel from "@/components/RequirementsPanel";
import { deleteProperty, saveProperty } from "@/app/dashboard/woningen/actions";
import { getDict } from "@/lib/i18n";
import { REASON_NL } from "@/lib/mail-texts";
import { deriveFromInput } from "@/lib/precheck";
import {
  DOCUMENT_TYPES,
  INCOME_TYPES,
  formToCriteria,
  type FormErrors,
  type RequirementsForm,
} from "@/lib/properties/requirements";
import { applicationInputSchema, propertyConfigSchema, type PropertyConfig, type Severity } from "@/lib/schema";

export type EditorInitial = {
  id?: string;
  organizationId: string;
  propertyId: string;
  address: string;
  rent: string;
  availableFrom: string;
  active: boolean;
  form: RequirementsForm;
};

type Props = {
  initial: EditorInitial;
  offices: { id: string; name: string; tenantKey: string }[];
  canEdit: boolean;
  /** Voorbeeldmodus (alleen lokaal): niets wordt opgeslagen. */
  preview?: boolean;
  /** "/dashboard" of "/dashboard/preview". */
  basePath: string;
  /** Aantal aanvragen voor deze woning (voor de waarschuwing bij verwijderen). */
  applicationCount?: number;
};

const t = getDict("nl");
const inputCls =
  "mt-1 block min-h-11 w-full rounded-md border border-zinc-500 bg-white px-3 py-2 text-base shadow-sm disabled:bg-zinc-100 aria-[invalid=true]:border-red-700";

function Section({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-semibold text-brand-900">{title}</h2>
      {intro && <p className="mt-1 text-sm text-zinc-700">{intro}</p>}
      <div className="mt-4 space-y-6">{children}</div>
    </section>
  );
}

/** Eén eis: titel, uitleg, de bediening, en (als dat zin heeft) de keuze wat er gebeurt als iemand er niet aan voldoet. */
function Requirement({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-zinc-100 pt-5 first:border-0 first:pt-0">
      <h3 className="font-medium text-zinc-900">{title}</h3>
      {hint && <p className="mt-0.5 text-sm text-zinc-600">{hint}</p>}
      <div className="mt-2 space-y-3">{children}</div>
    </div>
  );
}

function SeverityToggle({
  name, value, onChange, disabled,
}: { name: string; value: Severity; onChange: (v: Severity) => void; disabled: boolean }) {
  const opt = (v: Severity, label: string, hint: string) => (
    <label className={`flex min-h-11 cursor-pointer items-start gap-2 rounded-md border p-2 text-sm ${value === v ? "border-brand-600 bg-brand-50" : "border-zinc-300"}`}>
      <input type="radio" name={name} checked={value === v} disabled={disabled} onChange={() => onChange(v)} className="mt-1 h-5 w-5 shrink-0" />
      <span><span className="font-medium">{label}</span><span className="block text-xs text-zinc-600">{hint}</span></span>
    </label>
  );
  return (
    <fieldset className="mt-1">
      <legend className="text-sm font-medium text-zinc-800">Als iemand hier niet aan voldoet:</legend>
      <div className="mt-1 grid gap-2 sm:grid-cols-2">
        {opt("hard", "Past niet", "Komt onder Unsuitable (u kunt dit altijd wijzigen)")}
        {opt("review", "Zelf bekijken", "Komt onder Review, met dit punt erbij")}
      </div>
    </fieldset>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} role="alert" className="mt-1 text-sm text-red-700">{message}</p> : null;
}

const euro = (n: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export default function PropertyEditor({ initial, offices, canEdit, preview = false, basePath, applicationCount = 0 }: Props) {
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState(initial.organizationId);
  const [propertyId, setPropertyId] = useState(initial.propertyId);
  const [address, setAddress] = useState(initial.address);
  const [rent, setRent] = useState(initial.rent);
  const [availableFrom, setAvailableFrom] = useState(initial.availableFrom);
  const [active, setActive] = useState(initial.active);
  const [form, setForm] = useState<RequirementsForm>(initial.form);
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [testIncome, setTestIncome] = useState("");
  const [savedId, setSavedId] = useState(initial.id);

  const set = <K extends keyof RequirementsForm>(key: K, value: RequirementsForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setMessage("");
  };
  const disabled = !canEdit || saving;
  const tenantKey = offices.find((o) => o.id === organizationId)?.tenantKey ?? "";

  // Direct voorbeeld: alleen als de eisen geldig zijn.
  const converted = useMemo(() => formToCriteria(form), [form]);
  const rentNumber = Number(rent.replace(",", "."));
  const previewConfig: PropertyConfig | null = useMemo(() => {
    if (!converted.ok || !Number.isFinite(rentNumber) || rentNumber <= 0) return null;
    const parsed = propertyConfigSchema.safeParse({
      tenantId: tenantKey || "t", propertyId: propertyId || "p", rent: rentNumber, address: address || "Adres",
      criteria: converted.criteria, documentsLater: converted.documentsLater,
    });
    return parsed.success ? parsed.data : null;
  }, [converted, rentNumber, tenantKey, propertyId, address]);

  const factorNumber = Number(form.incomeFactor.replace(",", "."));
  const marginNumber = Number(form.incomeMarginPercent.replace(",", ".")) || 0;
  const required = Number.isFinite(factorNumber) && factorNumber > 0 && rentNumber > 0 ? rentNumber * factorNumber : null;

  // Inkomenstest: wat gebeurt er met een aanvrager die verder aan alles voldoet?
  const testResult = useMemo(() => {
    const income = Number(testIncome.replace(",", "."));
    if (!previewConfig || !Number.isFinite(income) || testIncome.trim() === "") return null;
    try {
      const c = previewConfig.criteria;
      const type = c.allowedIncomeTypes.includes("employment") ? "employment" : c.allowedIncomeTypes[0];
      const start = new Date();
      start.setDate(start.getDate() + 45);
      const startIso = c.startDateFrom && start.toISOString().slice(0, 10) < c.startDateFrom ? c.startDateFrom : start.toISOString().slice(0, 10);
      const input = applicationInputSchema.parse({
        lang: "nl", tenantId: "t", propertyId: "p",
        applicant: { name: "Test Persoon", email: "t@example.com", phone: "0612345678", ageConfirmed: true },
        persons: [{ role: "primary", incomeType: type, monthlyIncome: income, employmentMonths: 60, inProbation: false, isStudent: false }],
        situation: { hasHousemates: false, hasPets: false, occupants: 1 },
        lease: { desiredStartDate: startIso, desiredLeaseMonths: Math.max(c.minLeaseMonths ?? 1, 12), guarantorAvailable: c.guarantor === "required", depositGuaranteeOk: true },
        residence: { hasValidPermit: true }, consent: { privacyAccepted: true, version: "t" },
      });
      return deriveFromInput(input, previewConfig).precheck;
    } catch {
      return null;
    }
  }, [testIncome, previewConfig]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setMessage(""); setErrors({});
    // Eerst lokaal controleren voor een snelle melding; de server controleert opnieuw.
    const local = formToCriteria(form);
    if (!local.ok) {
      setErrors(local.errors);
      setError("Controleer de gemarkeerde velden.");
      return;
    }
    if (preview) { setMessage("Voorbeeld: er is niets opgeslagen."); return; }
    setSaving(true);
    const res = await saveProperty({ id: savedId, organizationId, propertyId, address, rent, availableFrom, active, form });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      if (res.errors) setErrors(res.errors);
      return;
    }
    setMessage("Opgeslagen. Het formulier voor woningzoekers gebruikt de nieuwe eisen binnen enkele seconden.");
    if (!savedId) {
      setSavedId(res.data.id);
      router.replace(`${basePath}/woningen/${res.data.id}`);
    }
    router.refresh();
  }

  async function onDelete() {
    if (!savedId) return;
    setSaving(true); setError("");
    const res = await deleteProperty(savedId);
    setSaving(false);
    if (!res.ok) { setError(res.error); setConfirmDelete(false); return; }
    router.replace(`${basePath}/woningen`);
    router.refresh();
  }

  const err = (k: keyof FormErrors) => errors[k];
  const invalid = (k: keyof FormErrors) => (errors[k] ? true : undefined);
  const errorMessages = Object.values(errors).filter(Boolean) as string[];

  return (
    <form onSubmit={onSave} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-5">
        {!canEdit && (
          <p role="note" className="rounded-md bg-amber-50 p-3 text-sm text-amber-950">
            U kunt de eisen bekijken. Alleen de eigenaar van het kantoor kan ze wijzigen.
          </p>
        )}

        <fieldset disabled={disabled} className="m-0 min-w-0 space-y-5 border-0 p-0">
          <Section title="De woning" intro="Dit zijn de gegevens die de woningzoeker bovenaan het formulier ziet.">
            {!initial.id && offices.length > 1 && (
              <div>
                <label htmlFor="office" className="block text-sm font-medium">Kantoor</label>
                <select id="office" className={inputCls} value={organizationId} onChange={(e) => setOrganizationId(e.target.value)}>
                  {offices.map((o) => (<option key={o.id} value={o.id}>{o.name}</option>))}
                </select>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="pid" className="block text-sm font-medium">Woning-id</label>
                <input id="pid" className={inputCls} value={propertyId} onChange={(e) => setPropertyId(e.target.value)}
                  aria-invalid={invalid("propertyId")} aria-describedby="pid-hint pid-err" readOnly={Boolean(savedId)} />
                <p id="pid-hint" className="mt-1 text-xs text-zinc-600">
                  Het id uit uw eigen systeem. Zet het in de scriptregel op uw site als <code>data-property-id</code>.{savedId ? " Het id kan na opslaan niet meer wijzigen." : ""}
                </p>
                <FieldError id="pid-err" message={err("propertyId")} />
              </div>
              <div>
                <label htmlFor="rent" className="block text-sm font-medium">Huurprijs per maand (€)</label>
                <input id="rent" inputMode="decimal" className={inputCls} value={rent} onChange={(e) => setRent(e.target.value)}
                  aria-invalid={invalid("rent")} aria-describedby="rent-err" />
                <FieldError id="rent-err" message={err("rent")} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium">Adres</label>
                <input id="address" className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)}
                  aria-invalid={invalid("address")} aria-describedby="address-err" />
                <FieldError id="address-err" message={err("address")} />
              </div>
              <div>
                <label htmlFor="avail" className="block text-sm font-medium">Beschikbaar vanaf (optioneel)</label>
                <input id="avail" type="date" className={inputCls} value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)}
                  aria-invalid={invalid("availableFrom")} aria-describedby="avail-err" />
                <FieldError id="avail-err" message={err("availableFrom")} />
              </div>
              <label className="flex min-h-11 items-center gap-3 self-end text-sm">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-6 w-6" />
                <span><span className="font-medium">Actief</span><span className="block text-xs text-zinc-600">Uit = het formulier opent niet; bestaande aanvragen blijven staan.</span></span>
              </label>
            </div>
          </Section>

          <Section title="Inkomen" intro="De belangrijkste eis voor de meeste woningen.">
            <Requirement title="Minimaal inkomen" hint="Als factor van de huur, bijvoorbeeld 3 keer de huur. Laat leeg als u geen inkomenseis stelt.">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label htmlFor="factor" className="block text-sm font-medium">Factor</label>
                  <input id="factor" inputMode="decimal" className={`${inputCls} w-28`} value={form.incomeFactor} onChange={(e) => set("incomeFactor", e.target.value)}
                    aria-invalid={invalid("incomeFactor")} aria-describedby="factor-err" />
                </div>
                <p className="pb-3 text-sm text-zinc-800">keer de huur{required ? <> = <strong>{euro(required)}</strong> bruto per maand</> : null}</p>
              </div>
              <FieldError id="factor-err" message={err("incomeFactor")} />
              <fieldset>
                <legend className="text-sm font-medium">Welk inkomen telt?</legend>
                <div className="mt-1 flex flex-wrap gap-4">
                  {([["household", "Alle aanvragers samen"], ["primary_applicant", "Alleen de hoofdaanvrager"]] as const).map(([v, label]) => (
                    <label key={v} className="flex min-h-11 items-center gap-2 text-sm">
                      <input type="radio" name="basis" checked={form.incomeBasis === v} onChange={() => set("incomeBasis", v)} className="h-5 w-5" />{label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label htmlFor="margin" className="block text-sm font-medium">Marge onder de eis (%)</label>
                  <input id="margin" inputMode="decimal" className={`${inputCls} w-28`} value={form.incomeMarginPercent} onChange={(e) => set("incomeMarginPercent", e.target.value)}
                    aria-invalid={invalid("incomeMarginPercent")} aria-describedby="margin-err" placeholder="0" />
                </div>
                <p className="pb-3 text-sm text-zinc-700">
                  {required && marginNumber > 0 && marginNumber <= 10
                    ? <>Een inkomen vanaf <strong>{euro(Math.round(required * (1 - marginNumber / 100)))}</strong> komt onder Review in plaats van Unsuitable.</>
                    : "Laat leeg voor geen marge. Maximaal 10%."}
                </p>
              </div>
              <FieldError id="margin-err" message={err("incomeMarginPercent")} />
              <SeverityToggle name="sev-income" value={form.incomeSeverity} onChange={(v) => set("incomeSeverity", v)} disabled={disabled} />
            </Requirement>

            <Requirement title="Toegestane inkomstenbronnen" hint="Alleen de aangevinkte bronnen tellen mee.">
              <div className="grid gap-1 sm:grid-cols-2" role="group" aria-label="Toegestane inkomstenbronnen">
                {INCOME_TYPES.map((it) => (
                  <label key={it} className="flex min-h-11 items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.incomeTypes.includes(it)} className="h-5 w-5"
                      onChange={(e) => set("incomeTypes", e.target.checked ? [...form.incomeTypes, it] : form.incomeTypes.filter((x) => x !== it))} />
                    {t.incomeTypes[it]}
                  </label>
                ))}
              </div>
              <FieldError id="types-err" message={err("incomeTypes")} />
              <SeverityToggle name="sev-types" value={form.incomeTypeSeverity} onChange={(v) => set("incomeTypeSeverity", v)} disabled={disabled} />
            </Requirement>

            <Requirement title="Aantal aanvragers" hint="Hoeveel personen mogen samen aanvragen (1 tot 4).">
              <select id="applicants" aria-label="Aantal aanvragers" className={`${inputCls} w-28`} value={form.maxApplicants} onChange={(e) => set("maxApplicants", e.target.value)}>
                {["1", "2", "3", "4"].map((n) => (<option key={n} value={n}>{n}</option>))}
              </select>
            </Requirement>

            <Requirement title="Garantsteller" hint="Mag er een garantsteller zijn, of is er één verplicht?">
              <div className="flex flex-wrap gap-4" role="radiogroup" aria-label="Garantsteller">
                {([["not_allowed", "Niet toegestaan"], ["allowed", "Toegestaan"], ["required", "Verplicht"]] as const).map(([v, label]) => (
                  <label key={v} className="flex min-h-11 items-center gap-2 text-sm">
                    <input type="radio" name="guarantor" checked={form.guarantor === v} onChange={() => set("guarantor", v)} className="h-5 w-5" />{label}
                  </label>
                ))}
              </div>
              {form.guarantor !== "not_allowed" && (
                <label className="flex min-h-11 items-start gap-2 text-sm">
                  <input type="checkbox" checked={form.guarantorCompensatesIncome} onChange={(e) => set("guarantorCompensatesIncome", e.target.checked)} className="mt-0.5 h-5 w-5" />
                  <span>Een garantsteller mag een inkomenstekort opvangen <span className="block text-xs text-zinc-600">Dan komt een tekort met garantsteller onder Review in plaats van Unsuitable.</span></span>
                </label>
              )}
              {form.guarantor === "required" && (
                <SeverityToggle name="sev-guarantor" value={form.guarantorSeverity} onChange={(v) => set("guarantorSeverity", v)} disabled={disabled} />
              )}
            </Requirement>
          </Section>

          <Section title="Dienstverband">
            <Requirement title="Proeftijd" hint="Mag iemand die nog in de proeftijd zit aanvragen?">
              <div className="flex flex-wrap gap-4" role="radiogroup" aria-label="Proeftijd">
                {([[true, "Toegestaan"], [false, "Niet toegestaan"]] as const).map(([v, label]) => (
                  <label key={label} className="flex min-h-11 items-center gap-2 text-sm">
                    <input type="radio" name="probation" checked={form.probationAllowed === v} onChange={() => set("probationAllowed", v)} className="h-5 w-5" />{label}
                  </label>
                ))}
              </div>
              {!form.probationAllowed && <SeverityToggle name="sev-prob" value={form.probationSeverity} onChange={(v) => set("probationSeverity", v)} disabled={disabled} />}
            </Requirement>
            <Requirement title="Minimale duur dienstverband" hint="In maanden, alleen voor loon uit dienstverband. Laat leeg of 0 voor geen eis.">
              <div className="flex items-center gap-3">
                <input id="emp" inputMode="numeric" aria-label="Minimale duur dienstverband in maanden" className={`${inputCls} w-28`} value={form.minEmploymentMonths}
                  onChange={(e) => set("minEmploymentMonths", e.target.value)} aria-invalid={invalid("minEmploymentMonths")} aria-describedby="emp-err" />
                <span className="text-sm">maanden</span>
              </div>
              <FieldError id="emp-err" message={err("minEmploymentMonths")} />
              {form.minEmploymentMonths.trim() !== "" && form.minEmploymentMonths.trim() !== "0" && (
                <SeverityToggle name="sev-emp" value={form.employmentSeverity} onChange={(v) => set("employmentSeverity", v)} disabled={disabled} />
              )}
            </Requirement>
          </Section>

          <Section title="Wonen en huurder">
            <Requirement title="Minimale leeftijd" hint="De woningzoeker bevestigt alleen dat hij of zij die leeftijd heeft.">
              <select aria-label="Minimale leeftijd" className={`${inputCls} w-40`} value={form.minAge} onChange={(e) => set("minAge", e.target.value as RequirementsForm["minAge"])}>
                <option value="">Geen eis</option><option value="18">18 jaar</option><option value="21">21 jaar</option>
              </select>
            </Requirement>
            <Requirement title="Huisdieren" hint="Als huisdieren niet mogen, vraagt het formulier ernaar. Anders komt de vraag niet voor.">
              <div className="flex flex-wrap gap-4" role="radiogroup" aria-label="Huisdieren">
                {([["any", "Maakt niet uit"], ["no", "Niet toegestaan"]] as const).map(([v, label]) => (
                  <label key={v} className="flex min-h-11 items-center gap-2 text-sm">
                    <input type="radio" name="pets" checked={form.pets === v} onChange={() => set("pets", v)} className="h-5 w-5" />{label}
                  </label>
                ))}
              </div>
              {form.pets === "no" && <SeverityToggle name="sev-pets" value={form.petsSeverity} onChange={(v) => set("petsSeverity", v)} disabled={disabled} />}
            </Requirement>
            <Requirement title="Maximaal aantal bewoners" hint="Inclusief kinderen. Laat leeg voor geen limiet (dan vraagt het formulier er ook niet naar).">
              <input id="occ" inputMode="numeric" aria-label="Maximaal aantal bewoners" className={`${inputCls} w-28`} value={form.maxOccupants}
                onChange={(e) => set("maxOccupants", e.target.value)} aria-invalid={invalid("maxOccupants")} aria-describedby="occ-err" />
              <FieldError id="occ-err" message={err("maxOccupants")} />
              {form.maxOccupants.trim() !== "" && <SeverityToggle name="sev-occ" value={form.occupantsSeverity} onChange={(v) => set("occupantsSeverity", v)} disabled={disabled} />}
            </Requirement>
            <Requirement title="Woningdelers">
              <div className="flex flex-wrap gap-4" role="radiogroup" aria-label="Woningdelers">
                {([[true, "Toegestaan"], [false, "Niet toegestaan"]] as const).map(([v, label]) => (
                  <label key={label} className="flex min-h-11 items-center gap-2 text-sm">
                    <input type="radio" name="housemates" checked={form.housematesAllowed === v} onChange={() => set("housematesAllowed", v)} className="h-5 w-5" />{label}
                  </label>
                ))}
              </div>
              {!form.housematesAllowed && <SeverityToggle name="sev-house" value={form.housematesSeverity} onChange={(v) => set("housematesSeverity", v)} disabled={disabled} />}
            </Requirement>
            <Requirement title="Studenten">
              <div className="flex flex-wrap gap-4" role="radiogroup" aria-label="Studenten">
                {([[true, "Toegestaan"], [false, "Niet toegestaan"]] as const).map(([v, label]) => (
                  <label key={label} className="flex min-h-11 items-center gap-2 text-sm">
                    <input type="radio" name="students" checked={form.studentsAllowed === v} onChange={() => set("studentsAllowed", v)} className="h-5 w-5" />{label}
                  </label>
                ))}
              </div>
              {!form.studentsAllowed && <SeverityToggle name="sev-stud" value={form.studentsSeverity} onChange={(v) => set("studentsSeverity", v)} disabled={disabled} />}
            </Requirement>
          </Section>

          <Section title="Huurovereenkomst">
            <Requirement title="Minimale huurperiode" hint="In maanden. Laat leeg voor geen eis.">
              <div className="flex items-center gap-3">
                <input id="lease" inputMode="numeric" aria-label="Minimale huurperiode in maanden" className={`${inputCls} w-28`} value={form.minLeaseMonths}
                  onChange={(e) => set("minLeaseMonths", e.target.value)} aria-invalid={invalid("minLeaseMonths")} aria-describedby="lease-err" />
                <span className="text-sm">maanden</span>
              </div>
              <FieldError id="lease-err" message={err("minLeaseMonths")} />
              {form.minLeaseMonths.trim() !== "" && <SeverityToggle name="sev-lease" value={form.leaseSeverity} onChange={(v) => set("leaseSeverity", v)} disabled={disabled} />}
            </Requirement>
            <Requirement title="Gewenste ingangsdatum" hint="Alleen invullen als de woning pas vanaf of uiterlijk tot een bepaalde datum beschikbaar is.">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="from" className="block text-sm font-medium">Vroegst</label>
                  <input id="from" type="date" className={inputCls} value={form.startFrom} onChange={(e) => set("startFrom", e.target.value)}
                    aria-invalid={invalid("startFrom")} aria-describedby="from-err" />
                  <FieldError id="from-err" message={err("startFrom")} />
                </div>
                <div>
                  <label htmlFor="until" className="block text-sm font-medium">Uiterlijk</label>
                  <input id="until" type="date" className={inputCls} value={form.startUntil} onChange={(e) => set("startUntil", e.target.value)}
                    aria-invalid={invalid("startUntil")} aria-describedby="until-err" />
                  <FieldError id="until-err" message={err("startUntil")} />
                </div>
              </div>
              {(form.startFrom || form.startUntil) && <SeverityToggle name="sev-start" value={form.startSeverity} onChange={(v) => set("startSeverity", v)} disabled={disabled} />}
            </Requirement>
            <Requirement title="Borgstelling" hint="Een bankgarantie of waarborgregeling in plaats van een waarborgsom.">
              <div className="flex flex-wrap gap-4" role="radiogroup" aria-label="Borgstelling">
                {([["not_needed", "Niet nodig"], ["allowed", "Mogelijk"], ["required", "Verplicht"]] as const).map(([v, label]) => (
                  <label key={v} className="flex min-h-11 items-center gap-2 text-sm">
                    <input type="radio" name="deposit" checked={form.depositGuarantee === v} onChange={() => set("depositGuarantee", v)} className="h-5 w-5" />{label}
                  </label>
                ))}
              </div>
              {form.depositGuarantee === "required" && <SeverityToggle name="sev-dep" value={form.depositSeverity} onChange={(v) => set("depositSeverity", v)} disabled={disabled} />}
            </Requirement>
            <Requirement title="Geldige verblijfsvergunning vereist" hint="Alleen ja of nee. Er wordt nooit op nationaliteit gestuurd.">
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input type="checkbox" checked={form.residencePermitRequired} onChange={(e) => set("residencePermitRequired", e.target.checked)} className="h-5 w-5" />
                Ja, vragen of de woningzoeker een geldige verblijfsvergunning heeft
              </label>
              {form.residencePermitRequired && <SeverityToggle name="sev-permit" value={form.permitSeverity} onChange={(v) => set("permitSeverity", v)} disabled={disabled} />}
            </Requirement>
          </Section>

          <Section title="Documenten die later gevraagd worden" intro="Het formulier noemt deze alvast, zodat de woningzoeker weet wat hij of zij later kan verwachten. Uploaden zelf is nog niet gebouwd.">
            <div className="grid gap-1 sm:grid-cols-2" role="group" aria-label="Documenten later">
              {DOCUMENT_TYPES.map((d) => (
                <label key={d} className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.documentsLater.includes(d)} className="h-5 w-5"
                    onChange={(e) => set("documentsLater", e.target.checked ? [...form.documentsLater, d] : form.documentsLater.filter((x) => x !== d))} />
                  {t.documents[d]}
                </label>
              ))}
            </div>
          </Section>
        </fieldset>

        <div className="flex flex-wrap gap-x-4 text-sm">
          <Link href={`${basePath}/woningen`} className="inline-flex min-h-11 items-center underline">Terug naar woningen</Link>
          {savedId && tenantKey && active && (
            <a href={`/embed/aanvraag/${tenantKey}/${propertyId}?lang=nl`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline">
              Open het formulier voor woningzoekers (nieuw tabblad)
            </a>
          )}
        </div>

        {savedId && canEdit && (
          <Section title="Woning verwijderen">
            {!confirmDelete ? (
              <button type="button" onClick={() => setConfirmDelete(true)} disabled={saving}
                className="min-h-11 rounded-md border border-red-800 px-4 text-sm font-medium text-red-800 hover:bg-red-50 disabled:opacity-50">
                Woning verwijderen…
              </button>
            ) : (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-950">
                <p className="font-medium">Definitief verwijderen?</p>
                <p className="mt-1">
                  {applicationCount > 0
                    ? `Er zijn ${applicationCount} aanvragen voor deze woning. Verwijderen is dan niet mogelijk; zet de woning op niet actief.`
                    : "De woning en haar eisen verdwijnen. Er zijn geen aanvragen voor deze woning."}
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button type="button" onClick={onDelete} disabled={saving || applicationCount > 0}
                    className="min-h-11 rounded-md bg-red-800 px-4 font-medium text-white hover:bg-red-900 disabled:opacity-60">Ja, verwijderen</button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="min-h-11 rounded-md border border-zinc-600 bg-white px-4 font-medium">Annuleren</button>
                </div>
              </div>
            )}
          </Section>
        )}

        <div className="sticky bottom-0 -mx-4 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={disabled}
              className="min-h-11 rounded-md bg-brand-800 px-6 font-medium text-white hover:bg-brand-700 disabled:opacity-60">
              {saving ? "Opslaan…" : "Opslaan"}
            </button>
            <div aria-live="polite" className="text-sm">
              {message && <span className="text-green-900">{message}</span>}
            </div>
          </div>
          {error && (
            <div role="alert" className="mt-2 text-sm text-red-800">
              <p className="font-medium">{error}</p>
              {errorMessages.length > 0 && <ul className="list-disc pl-5">{errorMessages.map((m) => (<li key={m}>{m}</li>))}</ul>}
            </div>
          )}
        </div>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-4 lg:self-start">
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-600">Zo ziet de woningzoeker het</h2>
          {previewConfig ? (
            <RequirementsPanel config={previewConfig} lang="nl" />
          ) : (
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-950">Vul de huurprijs in en corrigeer de gemarkeerde velden om het voorbeeld te zien.</p>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-brand-900">Probeer een inkomen</h2>
          <p className="mt-1 text-sm text-zinc-700">Wat gebeurt er met iemand die verder aan alles voldoet, met dit bruto maandinkomen?</p>
          <label htmlFor="testincome" className="mt-3 block text-sm font-medium">Bruto maandinkomen (€)</label>
          <input id="testincome" inputMode="decimal" className={inputCls} value={testIncome} onChange={(e) => setTestIncome(e.target.value)} />
          <div aria-live="polite" className="mt-3 min-h-6 text-sm">
            {testResult && (
              <div>
                <span className={`inline-block rounded-full px-3 py-1 font-medium ${testResult.status === "suitable" ? "bg-emerald-100 text-emerald-900" : testResult.status === "review" ? "bg-amber-100 text-amber-950" : "bg-slate-200 text-slate-900"}`}>
                  {testResult.status === "suitable" ? "Suitable" : testResult.status === "review" ? "Review" : "Unsuitable"}
                </span>
                {testResult.reasons.length > 0 && (
                  <p className="mt-2 text-zinc-700">Reden: {testResult.reasons.map((r) => REASON_NL[r]).join(", ")}</p>
                )}
              </div>
            )}
            {!testResult && testIncome.trim() !== "" && <p className="text-zinc-600">Corrigeer eerst de eisen om dit te testen.</p>}
          </div>
        </div>
      </aside>
    </form>
  );
}
