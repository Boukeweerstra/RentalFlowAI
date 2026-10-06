"use client";

import { cloneElement, useCallback, useEffect, useRef, useState } from "react";
import {
  INCOME_TYPES,
  applicationInputSchema,
  type IncomeType,
  type Lang,
  type Person,
  type PrecheckReason,
  type PropertyConfig,
} from "@/lib/schema";
import { deriveFromInput } from "@/lib/precheck";
import type { FormModel } from "@/lib/form-model";
import { needsEmploymentDetails } from "@/lib/form-model";
import { getDict, type Dict } from "@/lib/i18n";
import TurnstileBox from "@/components/TurnstileBox";

type PersonState = {
  role: Person["role"];
  incomeType: IncomeType | "";
  monthlyIncome: string;
  employmentMonths: string;
  inProbation: "" | "yes" | "no";
  isStudent: "" | "yes" | "no";
};

const emptyPerson = (role: Person["role"]): PersonState => ({
  role,
  incomeType: "",
  monthlyIncome: "",
  employmentMonths: "",
  inProbation: "",
  isStudent: "",
});

type YesNo = "" | "yes" | "no";
const toBool = (v: YesNo) => (v === "" ? undefined : v === "yes");

type Props = {
  config: PropertyConfig;
  model: FormModel;
  lang: Lang;
  privacyPolicyUrl?: string;
  privacyVersion: string;
  /** Woninggegevens uit het widget, alleen voor test-tenants zonder vaste woningconfig. */
  hints?: { rent?: number; address?: string };
  /** Ondertekend token van de server (bewijst o.a. hoe lang het formulier open stond). */
  formToken: string;
  /** Alleen gezet als Turnstile (botcontrole) actief is. */
  turnstileSiteKey?: string;
};

export default function ApplicationForm({
  config,
  model,
  lang,
  privacyPolicyUrl,
  privacyVersion,
  hints,
  formToken,
  turnstileSiteKey,
}: Props) {
  const t = getDict(lang);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [captchaBroken, setCaptchaBroken] = useState(false);
  // Stabiele functie: TurnstileBox zet zijn effect opnieuw op als deze verandert.
  const handleCaptchaError = useCallback(() => setCaptchaBroken(true), []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [persons, setPersons] = useState<PersonState[]>([emptyPerson("primary")]);
  const [hasHousemates, setHasHousemates] = useState<YesNo>("");
  const [hasPets, setHasPets] = useState<YesNo>("");
  const [occupants, setOccupants] = useState("");
  /** Gevuld = we tonen de waarschuwing en wachten op "Toch versturen". */
  const [warning, setWarning] = useState<{
    reasons: PrecheckReason[];
    body: Record<string, unknown>;
  } | null>(null);
  const warningRef = useRef<HTMLDivElement>(null);
  const [startDate, setStartDate] = useState("");
  const [leaseMonths, setLeaseMonths] = useState(
    String(Math.max(model.minLeaseMonths, 12)),
  );
  const [guarantor, setGuarantor] = useState<YesNo>("");
  const [depositOk, setDepositOk] = useState<YesNo>("");
  const [permit, setPermit] = useState<YesNo>("");
  const [motivation, setMotivation] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [formError, setFormError] = useState("");

  const total = persons.reduce((s, p) => s + (Number(p.monthlyIncome) || 0), 0);
  const today = new Date().toISOString().slice(0, 10);

  const updatePerson = (i: number, patch: Partial<PersonState>) =>
    setPersons((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  /** Zet de focus op het eerste foute veld (bij keuzerondjes: op het eerste rondje). */
  function focusFirstInvalid() {
    // setTimeout i.p.v. requestAnimationFrame: rAF draait niet in een verborgen tab/iframe.
    setTimeout(() => {
      const el = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      (el?.tagName === "FIELDSET" ? el.querySelector<HTMLElement>("input") : el)?.focus();
    }, 50);
  }

  // Na het versturen de bevestiging voorlezen en de focus daarheen verplaatsen.
  useEffect(() => {
    if (status === "done") doneRef.current?.focus();
  }, [status]);

  function errMsg(key: string): string | undefined {
    const code = errors[key];
    if (!code) return undefined;
    if (code === "occupants_below_applicants") return t.occupantsBelowApplicants;
    if (code === "email_not_allowed") return t.errorEmailNotAllowed;
    if (code === "invalid_name") return t.errorInvalidName;
    if (code === "links_not_allowed") return t.errorLinks;
    return code === "email" ? t.invalidEmail : t.required;
  }

  function validateClient(): Record<string, string> {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e["applicant.name"] = "required";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e["applicant.email"] = "email";
    if (phone.trim().length < 6) e["applicant.phone"] = "required";
    if (!ageConfirmed) e["applicant.ageConfirmed"] = "required";
    persons.forEach((p, i) => {
      if (!p.incomeType) e[`persons.${i}.incomeType`] = "required";
      if (p.monthlyIncome === "" || Number(p.monthlyIncome) < 0) {
        e[`persons.${i}.monthlyIncome`] = "required";
      }
      if (p.incomeType && needsEmploymentDetails(p.incomeType)) {
        if (p.employmentMonths === "") e[`persons.${i}.employmentMonths`] = "required";
        if (p.inProbation === "") e[`persons.${i}.inProbation`] = "required";
      }
      if (i === 0 && model.askStudent && p.isStudent === "") {
        e[`persons.${i}.isStudent`] = "required";
      }
    });
    if (model.askHousemates && hasHousemates === "") e["situation.hasHousemates"] = "required";
    if (model.askPets && hasPets === "") e["situation.hasPets"] = "required";
    if (model.askOccupants) {
      const n = Number(occupants);
      if (!occupants || !Number.isInteger(n) || n < 1) e["situation.occupants"] = "required";
      else if (n < persons.length) e["situation.occupants"] = "occupants_below_applicants";
    }
    if (!startDate) e["lease.desiredStartDate"] = "required";
    if (!leaseMonths || Number(leaseMonths) < 1) e["lease.desiredLeaseMonths"] = "required";
    if (model.askGuarantor && guarantor === "") e["lease.guarantorAvailable"] = "required";
    if (model.askDepositGuarantee && depositOk === "") e["lease.depositGuaranteeOk"] = "required";
    if (model.askResidencePermit && permit === "") e["residence.hasValidPermit"] = "required";
    if (!consent) e["consent.privacyAccepted"] = "required";
    return e;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const clientErrors = validateClient();
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) {
      setFormError(t.errorFix);
      focusFirstInvalid();
      return;
    }
    if (turnstileSiteKey && !turnstileToken) {
      setFormError(captchaBroken ? t.errorCaptcha : t.errorCaptchaRequired);
      return;
    }
    setFormError("");

    const body = {
      lang,
      tenantId: config.tenantId,
      propertyId: config.propertyId,
      applicant: { name, email, phone, ageConfirmed: true },
      persons: persons.map((p) => ({
        role: p.role,
        incomeType: p.incomeType,
        monthlyIncome: Number(p.monthlyIncome),
        ...(p.incomeType && needsEmploymentDetails(p.incomeType)
          ? {
              employmentMonths: Number(p.employmentMonths),
              inProbation: toBool(p.inProbation),
            }
          : {}),
        ...(p.role === "primary" && model.askStudent
          ? { isStudent: toBool(p.isStudent) }
          : {}),
      })),
      situation: {
        hasHousemates: hasHousemates === "yes",
        ...(model.askPets ? { hasPets: toBool(hasPets) } : {}),
        ...(model.askOccupants ? { occupants: Number(occupants) } : {}),
      },
      hints,
      lease: {
        desiredStartDate: startDate,
        desiredLeaseMonths: Number(leaseMonths),
        ...(model.askGuarantor ? { guarantorAvailable: toBool(guarantor) } : {}),
        ...(model.askDepositGuarantee ? { depositGuaranteeOk: toBool(depositOk) } : {}),
      },
      residence: model.askResidencePermit ? { hasValidPermit: toBool(permit) } : {},
      motivation: motivation.trim() || undefined,
      consent: { privacyAccepted: true, version: privacyVersion },
      website,
      formToken,
    };

    // Zelfde regels als op de server: past deze kandidaat op papier niet? Dan
    // eerst waarschuwen. Versturen blijft altijd mogelijk.
    const parsed = applicationInputSchema.safeParse(body);
    if (parsed.success) {
      const { precheck } = deriveFromInput(parsed.data, config);
      if (precheck.status === "unsuitable") {
        setWarning({ reasons: precheck.reasons, body });
        setTimeout(() => warningRef.current?.focus(), 50);
        return;
      }
    }
    await send(body);
  }

  async function send(body: Record<string, unknown>) {
    setWarning(null);
    setStatus("sending");
    // Een Turnstile-token is eenmalig; na elke poging (ook een mislukte) vragen we een nieuwe.
    const consumeCaptcha = () => {
      if (!turnstileSiteKey) return;
      setTurnstileToken("");
      setTurnstileReset((n) => n + 1);
    };
    try {
      const res = await fetch("/api/aanvraag", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...body, turnstileToken: turnstileToken || undefined }),
      });
      if (res.ok) {
        setStatus("done");
        window.parent?.postMessage({ source: "rentalflowai", type: "submitted" }, "*");
        return;
      }
      consumeCaptcha();
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        errors?: Record<string, string>;
      };
      if (res.status === 400 && data.errors) {
        setErrors(data.errors);
        setFormError(t.errorFix);
        focusFirstInvalid();
      } else {
        const messages: Record<string, string> = {
          rate_limited: t.errorRateLimit,
          duplicate: t.errorDuplicate,
          busy: t.errorBusy,
          too_fast: t.errorTooFast,
          session_invalid: t.errorSession,
          session_expired: t.errorSession,
          captcha_failed: t.errorCaptcha,
          captcha_unavailable: t.errorCaptcha,
        };
        setFormError(messages[data.error ?? ""] ?? t.errorGeneric);
      }
      setStatus("error");
    } catch {
      consumeCaptcha();
      setFormError(t.errorGeneric);
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div ref={doneRef} tabIndex={-1} role="status"
        className="rounded-lg border border-green-200 bg-green-50 p-6 outline-none">
        <h2 className="text-lg font-semibold text-green-900">{t.successTitle}</h2>
        <p className="mt-2 text-green-900">{t.successBody}</p>
        {/* Alleen in het widget (iframe) heeft sluiten zin. */}
        <button type="button"
          onClick={() => window.parent?.postMessage({ source: "rentalflowai", type: "close" }, "*")}
          className="mt-4 min-h-11 rounded-md bg-green-900 px-4 py-2 font-medium text-white hover:bg-green-800">
          {t.close}
        </button>
      </div>
    );
  }

  const privacyLink = privacyPolicyUrl ? (
    <a href={privacyPolicyUrl} target="_blank" rel="noopener noreferrer" className="underline">
      {t.privacyLink}
    </a>
  ) : (
    <span>{t.privacyNoLink}</span>
  );

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-8">
      <p className="text-sm text-zinc-700">{t.allRequired}</p>
      {/* Honeypot: mensen zien dit niet; bots vullen het in. */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      {/* Tijdens de waarschuwing zijn de velden vergrendeld, zodat er niets anders
          verstuurd kan worden dan wat de zoeker net gezien heeft. */}
      <fieldset disabled={!!warning} className="m-0 min-w-0 space-y-8 border-0 p-0">
      <fieldset className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <legend className="px-1 text-lg font-semibold text-brand-900">{t.sectionYou}</legend>
        <Field label={t.name} error={errMsg("applicant.name")} id="name">
          <input id="name" className={inputCls} autoComplete="name" value={name}
            onChange={(e) => setName(e.target.value)} aria-invalid={!!errors["applicant.name"]} />
        </Field>
        <Field label={t.email} error={errMsg("applicant.email")} id="email">
          <input id="email" type="email" className={inputCls} autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors["applicant.email"]} />
        </Field>
        <Field label={t.phone} error={errMsg("applicant.phone")} id="phone">
          <input id="phone" type="tel" className={inputCls} autoComplete="tel" value={phone}
            onChange={(e) => setPhone(e.target.value)} aria-invalid={!!errors["applicant.phone"]} />
        </Field>
        <Check id="age" checked={ageConfirmed} onChange={setAgeConfirmed}
          label={t.ageConfirm(model.minAge)} error={errMsg("applicant.ageConfirmed")} />
      </fieldset>

      <fieldset className="space-y-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <legend className="px-1 text-lg font-semibold text-brand-900">{t.sectionPersons}</legend>
        {persons.map((p, i) => (
          <div key={i} className="space-y-4 rounded-lg bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{i === 0 ? t.primaryPerson : t.extraPerson(i)}</h3>
              {i > 0 && (
                <button type="button" className="min-h-11 px-2 text-sm underline"
                  onClick={() => setPersons((ps) => ps.filter((_, idx) => idx !== i))}>
                  {t.removePerson}
                </button>
              )}
            </div>
            {i > 0 && (
              <Field label={t.role} id={`role-${i}`} error={errMsg(`persons.${i}.role`)}>
                <select id={`role-${i}`} className={inputCls} value={p.role}
                  onChange={(e) => updatePerson(i, { role: e.target.value as Person["role"] })}>
                  {model.extraPersonRoles.map((r) => (
                    <option key={r} value={r}>{t.roles[r]}</option>
                  ))}
                </select>
              </Field>
            )}
            <Field label={t.incomeType} id={`it-${i}`} error={errMsg(`persons.${i}.incomeType`)}>
              <select id={`it-${i}`} className={inputCls} value={p.incomeType}
                aria-invalid={!!errors[`persons.${i}.incomeType`]}
                onChange={(e) => updatePerson(i, { incomeType: e.target.value as IncomeType })}>
                <option value="">{t.choose}</option>
                {INCOME_TYPES.map((it) => (
                  <option key={it} value={it}>{t.incomeTypes[it]}</option>
                ))}
              </select>
            </Field>
            <Field label={t.monthlyIncome} id={`inc-${i}`} error={errMsg(`persons.${i}.monthlyIncome`)}>
              <input id={`inc-${i}`} type="number" inputMode="decimal" min={0} step="1"
                className={inputCls} value={p.monthlyIncome}
                aria-invalid={!!errors[`persons.${i}.monthlyIncome`]}
                onChange={(e) => updatePerson(i, { monthlyIncome: e.target.value })} />
            </Field>
            {p.incomeType && needsEmploymentDetails(p.incomeType) && (
              <>
                <Field label={t.employmentMonths} id={`em-${i}`} error={errMsg(`persons.${i}.employmentMonths`)}>
                  <input id={`em-${i}`} type="number" min={0} step="1" className={inputCls}
                    value={p.employmentMonths}
                    onChange={(e) => updatePerson(i, { employmentMonths: e.target.value })} />
                </Field>
                <YesNoField legend={t.inProbation} t={t} value={p.inProbation}
                  onChange={(v) => updatePerson(i, { inProbation: v })}
                  error={errMsg(`persons.${i}.inProbation`)} name={`prob-${i}`} />
              </>
            )}
            {i === 0 && model.askStudent && (
              <YesNoField legend={t.isStudent} t={t} value={p.isStudent}
                onChange={(v) => updatePerson(i, { isStudent: v })}
                error={errMsg(`persons.${i}.isStudent`)} name="student" />
            )}
          </div>
        ))}
        {persons.length < model.maxApplicants && (
          <button type="button" className="min-h-11 rounded-md border border-zinc-500 px-3 py-2 text-sm font-medium hover:bg-zinc-50"
            onClick={() => setPersons((ps) => [...ps, emptyPerson(model.extraPersonRoles[0])])}>
            + {t.addPerson}
          </button>
        )}
        {persons.length > 1 && (
          <p className="text-sm text-zinc-700">
            {t.householdIncome}:{" "}
            <strong>{new Intl.NumberFormat(lang === "nl" ? "nl-NL" : "en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(total)}</strong>
          </p>
        )}
      </fieldset>

      {(model.askHousemates || model.askPets || model.askOccupants) && (
        <fieldset className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
          <legend className="px-1 text-lg font-semibold text-brand-900">{t.sectionSituation}</legend>
          {model.askOccupants && (
            <Field label={t.occupants} id="occupants" hint={t.occupantsHint}
              error={errMsg("situation.occupants")}>
              <input id="occupants" type="number" min={1} max={20} step="1" className={inputCls}
                value={occupants} aria-invalid={!!errors["situation.occupants"]}
                onChange={(e) => setOccupants(e.target.value)} />
            </Field>
          )}
          {model.askHousemates && (
            <YesNoField legend={t.hasHousemates} t={t} value={hasHousemates}
              onChange={setHasHousemates} error={errMsg("situation.hasHousemates")} name="housemates" />
          )}
          {model.askPets && (
            <YesNoField legend={t.hasPets} t={t} value={hasPets}
              onChange={setHasPets} error={errMsg("situation.hasPets")} name="pets" />
          )}
        </fieldset>
      )}

      <fieldset className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <legend className="px-1 text-lg font-semibold text-brand-900">{t.sectionLease}</legend>
        <Field label={t.desiredStartDate} id="start" error={errMsg("lease.desiredStartDate")}>
          <input id="start" type="date" min={today} className={inputCls} value={startDate}
            onChange={(e) => setStartDate(e.target.value)} aria-invalid={!!errors["lease.desiredStartDate"]} />
        </Field>
        <Field label={t.desiredLeaseMonths} id="months" error={errMsg("lease.desiredLeaseMonths")}>
          <input id="months" type="number" min={1} max={120} step="1" className={inputCls}
            value={leaseMonths} onChange={(e) => setLeaseMonths(e.target.value)} />
        </Field>
        {model.askGuarantor && (
          <YesNoField legend={t.guarantorAvailable} t={t} value={guarantor} onChange={setGuarantor}
            error={errMsg("lease.guarantorAvailable")} name="guarantor" />
        )}
        {model.askDepositGuarantee && (
          <YesNoField legend={t.depositGuaranteeOk} t={t} value={depositOk} onChange={setDepositOk}
            error={errMsg("lease.depositGuaranteeOk")} name="deposit" />
        )}
        {model.askResidencePermit && (
          <YesNoField legend={t.hasValidPermit} t={t} value={permit} onChange={setPermit}
            error={errMsg("residence.hasValidPermit")} name="permit" />
        )}
      </fieldset>

      <Field label={t.motivation} id="motivation" hint={t.motivationHint}>
        <textarea id="motivation" rows={3} maxLength={1000} className={inputCls} value={motivation}
          onChange={(e) => setMotivation(e.target.value)} />
      </Field>

      <Check id="consent" checked={consent} onChange={setConsent}
        label={t.privacyBefore + t.privacyAfter}
        labelNode={<>{t.privacyBefore}{privacyLink}{t.privacyAfter}</>}
        error={errMsg("consent.privacyAccepted")} />

      </fieldset>

      {warning ? (
        <div ref={warningRef} tabIndex={-1} role="alertdialog" aria-labelledby="warn-title"
          aria-describedby="warn-body"
          className="space-y-3 rounded-lg border-2 border-amber-500 bg-amber-50 p-4 outline-none">
          <h2 id="warn-title" className="font-semibold text-amber-950">{t.warnTitle}</h2>
          <p id="warn-body" className="text-sm text-amber-950">{t.warnBody}</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-amber-950">
            {warning.reasons.map((r) => (
              <li key={r}>{t.reasons[r]}</li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => setWarning(null)}
              className="min-h-11 rounded-md border border-zinc-500 bg-white px-4 py-2 font-medium hover:bg-zinc-50">
              {t.warnBack}
            </button>
            <button type="button" onClick={() => send(warning.body)}
              className="min-h-11 rounded-md bg-brand-800 px-4 py-2 font-medium text-white hover:bg-brand-700">
              {t.warnSend}
            </button>
          </div>
        </div>
      ) : (
        <>
          {turnstileSiteKey && (
            <div>
              <p className="mb-1 text-sm font-medium">{t.captchaLabel}</p>
              <TurnstileBox
                siteKey={turnstileSiteKey}
                lang={lang}
                resetKey={turnstileReset}
                onToken={setTurnstileToken}
                onError={handleCaptchaError}
              />
            </div>
          )}
          {formError && (
            <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{formError}</p>
          )}
          <button type="submit" disabled={status === "sending"}
            className="w-full rounded-md bg-brand-800 px-4 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-60">
            {status === "sending" ? t.submitting : t.submit}
          </button>
        </>
      )}
    </form>
  );
}

// Rand met voldoende contrast (zinc-500 op wit = 4,8:1; WCAG 1.4.11 vraagt 3:1).
const inputCls =
  "mt-1 block w-full min-h-11 rounded-md border border-zinc-500 bg-white px-3 py-2 text-base shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 aria-[invalid=true]:border-red-700";

/**
 * Label + invoer + hint + foutmelding. Koppelt hint en fout aan het invoerveld
 * (aria-describedby) zodat screenreaders ze voorlezen.
 */
function Field({
  label, id, error, hint, children,
}: { label: string; id: string; error?: string; hint?: string; children: React.ReactElement<Record<string, unknown>> }) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-err` : null]
    .filter(Boolean)
    .join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      {hint && <p id={`${id}-hint`} className="text-xs text-zinc-600">{hint}</p>}
      {cloneElement(children, {
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })}
      {error && <p id={`${id}-err`} className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}

function Check({
  id, checked, onChange, label, labelNode, error,
}: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string; labelNode?: React.ReactNode; error?: string }) {
  return (
    <div>
      <label htmlFor={id} className="flex min-h-11 items-start gap-3 py-1 text-sm">
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-6 w-6 shrink-0" aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined} />
        <span>{labelNode ?? label}</span>
      </label>
      {error && <p id={`${id}-err`} className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}

function YesNoField({
  legend, value, onChange, error, name, t,
}: { legend: string; value: YesNo; onChange: (v: YesNo) => void; error?: string; name: string; t: Dict }) {
  return (
    <fieldset aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${name}-err` : undefined}>
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="mt-1 flex gap-6">
        {(["yes", "no"] as const).map((v) => (
          <label key={v} className="flex min-h-11 items-center gap-2 pr-2 text-sm">
            <input type="radio" name={name} checked={value === v} onChange={() => onChange(v)}
              className="h-6 w-6" />
            {v === "yes" ? t.yes : t.no}
          </label>
        ))}
      </div>
      {error && <p id={`${name}-err`} className="mt-1 text-sm text-red-700">{error}</p>}
    </fieldset>
  );
}
