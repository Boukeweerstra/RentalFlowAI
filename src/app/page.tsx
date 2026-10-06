import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/marketing/SiteFooter";
import SiteHeader from "@/components/marketing/SiteHeader";

export const metadata: Metadata = {
  title: "RentalFlowAI – aanvragen voor huurwoningen, compleet en voorgesorteerd",
  description:
    "Een Aanvraag-knop voor de website van een verhuurmakelaar. De woningzoeker vult in wat voor deze woning nodig is, de makelaar ziet direct wie past. De computer wijst nooit af.",
  robots: { index: false, follow: false },
};

type Tone = "green" | "amber" | "slate";
const TONE: Record<Tone, { chip: string; bar: string; ring: string }> = {
  green: { chip: "bg-emerald-100 text-emerald-900", bar: "bg-emerald-600", ring: "border-emerald-200" },
  amber: { chip: "bg-amber-100 text-amber-950", bar: "bg-amber-500", ring: "border-amber-200" },
  slate: { chip: "bg-slate-200 text-slate-900", bar: "bg-slate-500", ring: "border-slate-300" },
};

/** Verzonnen voorbeeldkaart, alleen ter illustratie (decoratief, verborgen voor schermlezers). */
function MiniCard({ tone, group, name, line, reason }: { tone: Tone; group: string; name: string; line: string; reason: string }) {
  const t = TONE[tone];
  return (
    <div aria-hidden="true" className={`flex overflow-hidden rounded-xl border bg-white shadow-sm ${t.ring}`}>
      <div className={`w-1.5 ${t.bar}`} />
      <div className="flex-1 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-zinc-900">{name}</p>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${t.chip}`}>{group}</span>
        </div>
        <p className="mt-0.5 text-sm text-zinc-600">{line}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="rounded-md border border-zinc-300 px-2 py-1 text-zinc-800">06 12 34 56 78</span>
          <span className="rounded-md border border-zinc-300 px-2 py-1 text-zinc-800">naam@voorbeeld.nl</span>
        </div>
        <p className="mt-3 text-xs text-zinc-600">{reason}</p>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="relative rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
      <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-800 text-sm font-semibold text-white">{n}</span>
      <h3 className="mt-3 text-lg font-semibold text-brand-900">{title}</h3>
      <p className="mt-1 text-zinc-700">{children}</p>
    </li>
  );
}

function Group({ tone, title, subtitle, children }: { tone: Tone; title: string; subtitle: string; children: React.ReactNode }) {
  const t = TONE[tone];
  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${t.ring}`}>
      <div className="flex items-center gap-3">
        <span className={`h-8 w-1.5 rounded-full ${t.bar}`} aria-hidden="true" />
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
          <p className="text-sm text-zinc-600">{subtitle}</p>
        </div>
      </div>
      <p className="mt-3 text-zinc-700">{children}</p>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-brand-100 bg-white p-4 shadow-sm open:bg-brand-50/50">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-medium text-brand-900">
        {q}
        <span aria-hidden="true" className="text-brand-600 transition group-open:rotate-45">+</span>
      </summary>
      <div className="mt-2 space-y-2 text-zinc-700">{children}</div>
    </details>
  );
}

export default function Home() {
  const showPreviewLink = process.env.NODE_ENV !== "production";
  return (
    <div lang="nl" className="bg-white text-zinc-900">
      <a href="#inhoud" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-30 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Naar de inhoud
      </a>
      <SiteHeader showPreviewLink={showPreviewLink} />

      <main id="inhoud">
        {/* Held */}
        <section className="bg-gradient-to-b from-brand-50 to-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
            <div>
              <p className="inline-block rounded-full bg-accent-100 px-3 py-1 text-sm font-medium text-accent-700">Prototype voor verhuurmakelaars</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-brand-900 sm:text-5xl">
                Huuraanvragen die al compleet binnenkomen, en al voorgesorteerd.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-zinc-700">
                RentalFlowAI zet een <strong>Aanvraag-knop</strong> op de woningpagina op uw website. De woningzoeker vult alleen in wat voor déze woning nodig is.
                U ziet direct wie past, wie u zelf wilt bekijken en wie niet past, met telefoon en e-mail klaar om te bellen.
              </p>
              <p className="mt-3 max-w-xl text-zinc-700">
                De computer wijst <strong>nooit</strong> iemand af. Hij sorteert voor. U beslist.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/demo-host.html" className="inline-flex min-h-12 items-center rounded-md bg-brand-800 px-6 text-base font-medium text-white hover:bg-brand-700">
                  Probeer de aanvraagknop
                </Link>
                <a href="#hoe" className="inline-flex min-h-12 items-center rounded-md border border-brand-200 bg-white px-6 text-base font-medium text-brand-800 hover:bg-brand-50">
                  Zo werkt het
                </a>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-zinc-600">Zo ziet u uw aanvragen (verzonnen voorbeeld):</p>
              <MiniCard tone="green" group="Suitable" name="Anna de Vries" line="Keizersgracht 100 · € 6.100 per maand · eis € 5.550" reason="Volgende stap: neem contact op en plan een bezichtiging" />
              <MiniCard tone="amber" group="Review" name="Mark Jansen" line="Keizersgracht 100 · € 6.000 per maand · in proeftijd" reason="Volgende stap: controleer het dienstverband, vraag een werkgeversverklaring" />
              <MiniCard tone="slate" group="Unsuitable" name="Lars Smit" line="Keizersgracht 100 · € 2.000 per maand · huisdier" reason="Volgens de regels niet passend. U kunt dit altijd aanpassen" />
            </div>
          </div>
        </section>

        {/* Probleem en oplossing */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-6">
              <h2 className="text-xl font-semibold text-zinc-900">Nu</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-zinc-700">
                <li>Mails en formulieren met verschillende gegevens, vaak onvolledig.</li>
                <li>Elke aanvraag handmatig nalopen op inkomen, proeftijd, huisdieren en bewoners.</li>
                <li>Veel aanvragen bij woningen waar de eisen niet bij passen.</li>
                <li>Alles verspreid over mailbox en spreadsheet.</li>
              </ul>
            </div>
            <div className="rounded-2xl bg-accent-50 p-6">
              <h2 className="text-xl font-semibold text-accent-700">Met RentalFlowAI</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-zinc-700">
                <li>Eén vast formulier per woning, met precies de vragen die bij uw eisen horen.</li>
                <li>De eerste check doet de computer met vaste, uitlegbare regels.</li>
                <li>Een dashboard met drie groepen, telefoon en e-mail direct zichtbaar.</li>
                <li>U blijft beslissen en kunt elke groep zelf aanpassen.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Hoe het werkt */}
        <section id="hoe" className="scroll-mt-20 bg-brand-50/60">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight text-brand-900">Zo werkt het, in vier stappen</h2>
            <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Step n={1} title="Een knop op uw site">
                U plaatst één regel code op de woningpagina. Er verschijnt een knop &ldquo;Aanvraag&rdquo; die het formulier voor déze woning opent, zonder dat de bezoeker uw site verlaat.
              </Step>
              <Step n={2} title="Alleen de nodige vragen">
                Het formulier toont eerst de eisen van de woning en vraagt daarna alleen wat daarbij hoort. Huisdieren verboden? Dan vragen we naar huisdieren. Anders niet.
              </Step>
              <Step n={3} title="Een eerste check">
                Vaste regels vergelijken de antwoorden met uw eisen en leggen de uitkomst vast, met de redenen erbij. Elke aanvraag is zichtbaar; er verdwijnt er niets.
              </Step>
              <Step n={4} title="U beslist">
                U krijgt een melding met een link naar het dashboard. Daar belt of mailt u, wijzigt u de groep en de status, en zet u een notitie erbij.
              </Step>
            </ol>
          </div>
        </section>

        {/* De drie groepen */}
        <section id="groepen" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight text-brand-900">De drie groepen</h2>
          <p className="mt-2 max-w-3xl text-zinc-700">
            Elke aanvraag komt in één van de drie groepen. Dat is een <strong>eerste indicatie</strong> op basis van uw eigen eisen, geen oordeel over de persoon.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <Group tone="green" title="Suitable" subtitle="geschikt voor bezichtiging">
              Alle eisen van de woning zijn gehaald. Volgende stap: contact opnemen en een bezichtiging plannen.
            </Group>
            <Group tone="amber" title="Review" subtitle="zelf beoordelen">
              Eén of meer punten wilt u zelf bekijken, bijvoorbeeld een proeftijd, een kort dienstverband, een garantsteller of een inkomen net onder de grens. U ziet precies welk punt.
            </Group>
            <Group tone="slate" title="Unsuitable" subtitle="volgens de regels niet passend">
              Een harde eis wordt niet gehaald, bijvoorbeeld een huisdier waar dat niet mag. De aanvraag blijft zichtbaar, en u kunt de groep altijd zelf wijzigen.
            </Group>
          </div>
          <div className="mt-8 rounded-2xl border border-accent-100 bg-accent-50 p-5">
            <h3 className="text-lg font-semibold text-accent-700">Hoe streng, bepaalt u</h3>
            <p className="mt-1 text-zinc-700">
              Per woning en per eis wordt vastgelegd of het een <em>harde</em> eis is (dan Unsuitable) of een punt om zelf te bekijken (dan Review). Er kan ook een marge worden ingesteld, zodat een inkomen net onder de grens in Review komt in plaats van Unsuitable.
              De woningzoeker krijgt geen afwijzing van de computer: alleen een neutrale ontvangstbevestiging.
            </p>
            <p className="mt-2 text-sm text-zinc-600">Stand van zaken: deze instellingen zetten wij nu voor u klaar. Een scherm waarmee u ze zelf wijzigt, is nog niet gebouwd.</p>
          </div>
        </section>

        {/* Dashboard */}
        <section className="bg-brand-900 text-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">Eén overzicht in plaats van mailbox en spreadsheet</h2>
              <p className="mt-3 text-brand-100">Het dashboard is alleen voor uw kantoor, achter een login.</p>
            </div>
            <ul className="space-y-3 text-brand-100">
              <li className="flex gap-3"><span aria-hidden="true" className="mt-1 text-teal-300">✓</span><span><strong className="text-white">Bellen en mailen met één klik.</strong> Telefoon en e-mail staan groot bovenaan elke aanvraag, met een kopieerknop.</span></li>
              <li className="flex gap-3"><span aria-hidden="true" className="mt-1 text-teal-300">✓</span><span><strong className="text-white">Nieuwe aanvragen verschijnen vanzelf</strong>, zonder te verversen.</span></li>
              <li className="flex gap-3"><span aria-hidden="true" className="mt-1 text-teal-300">✓</span><span><strong className="text-white">Zoeken, filteren en sorteren</strong> op naam, woning, status of inkomen.</span></li>
              <li className="flex gap-3"><span aria-hidden="true" className="mt-1 text-teal-300">✓</span><span><strong className="text-white">Status en notities:</strong> nieuw, benaderd, bezichtiging gepland, afgerond, met een logboek van wie wat deed.</span></li>
              <li className="flex gap-3"><span aria-hidden="true" className="mt-1 text-teal-300">✓</span><span><strong className="text-white">Bij elke aanvraag een voorgestelde volgende stap</strong>, bijvoorbeeld &ldquo;vraag een werkgeversverklaring&rdquo;.</span></li>
            </ul>
          </div>
        </section>

        {/* AI */}
        <section id="ai" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight text-brand-900">AI: alleen waar het helpt, en nooit als beslisser</h2>
          <p className="mt-2 max-w-3xl text-zinc-700">
            Cijfers en ja/nee-vragen blijven vaste regels: voorspelbaar en uit te leggen. AI is een <strong>hulpmiddel</strong>, standaard uit, en alleen voor tekst.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-brand-900">Samenvatting van de toelichting</h3>
              <p className="mt-1 text-zinc-700">Schrijft de woningzoeker een lange toelichting, dan ziet u een korte samenvatting met aandachtspunten, náást de originele tekst. Bijvoorbeeld: &ldquo;ouders willen garant staan&rdquo;.</p>
            </div>
            <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-brand-900">Conceptmail bij ontbrekende informatie</h3>
              <p className="mt-1 text-zinc-700">Bij een aanvraag onder Review kunt u op een knop klikken voor een <em>concept</em>-mail die om de ontbrekende stukken vraagt. U leest, past aan en verstuurt zelf.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 rounded-2xl bg-slate-50 p-5 md:grid-cols-2">
            <div>
              <h3 className="font-semibold text-zinc-900">Wat de AI niet doet</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-700">
                <li>De groep van een aanvraag bepalen of wijzigen.</li>
                <li>Iets versturen naar een woningzoeker.</li>
                <li>Naam, e-mailadres of telefoonnummer te zien krijgen.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900">Waarom het zo is gebouwd</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-700">
                <li>Een samenvatting of concept met een oordeel erin wordt automatisch tegengehouden.</li>
                <li>Een vast dagplafond houdt de kosten laag.</li>
                <li>We hebben het getest op vijandige teksten (&ldquo;negeer alle regels&rdquo;) en op gevoelige onderwerpen.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section id="privacy" className="scroll-mt-20 bg-brand-50/60">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight text-brand-900">Privacy en beveiliging, in gewone taal</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-brand-900">Minimaal vragen</h3>
                <p className="mt-1 text-zinc-700">Geen kopie van een identiteitsbewijs en geen BSN. Het formulier noemt welke documenten later nodig zijn; die worden pas gevraagd als de aanvraag past. Uploaden zelf is nog niet gebouwd.</p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-brand-900">Niet te lang bewaren</h3>
                <p className="mt-1 text-zinc-700">Aanvragen worden standaard na zes maanden automatisch verwijderd. Eerder verwijderen kan met één knop; dat wordt vastgelegd zonder persoonsgegevens.</p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-brand-900">Alleen uw kantoor</h3>
                <p className="mt-1 text-zinc-700">Inloggen is verplicht, en een kantoor ziet alleen zijn eigen aanvragen. Er is geen openbare aanmelding.</p>
              </div>
            </div>
            <p className="mt-6 max-w-3xl text-sm text-zinc-600">
              Eerlijk over de stand van zaken: dit is een prototype. De privacyverklaring en de verwerkersafspraken zijn concepten en nog niet door een jurist gecontroleerd. Voor echte aanvragen moet dat eerst gebeuren.
            </p>
          </div>
        </section>

        {/* Veelgestelde vragen */}
        <section id="vragen" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-14 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight text-brand-900">Veelgestelde vragen</h2>
          <div className="mt-6 space-y-3">
            <Faq q="Wijst de computer aanvragers af?">
              <p>Nee. De computer sorteert voor in drie groepen en laat de redenen zien. Elke aanvraag blijft zichtbaar en een medewerker beslist altijd. De woningzoeker krijgt alleen een neutrale ontvangstbevestiging.</p>
            </Faq>
            <Faq q="Kan ik de eisen per woning zelf bepalen?">
              <p>Ja. Per woning legt u vast: minimale leeftijd, inkomensfactor, inkomstenbronnen, proeftijd, minimale duur dienstverband, huisdieren, aantal bewoners, garantsteller, studenten, woningdelers en meer. Per eis kiest u of die hard is of een punt om zelf te bekijken. Nu zetten wij die instellingen voor u klaar; zelf wijzigen in het dashboard komt later.</p>
            </Faq>
            <Faq q="Hoe krijg ik de knop op mijn website?">
              <p>Met één regel code die u (of uw websitebouwer) op de woningpagina plaatst. U geeft de woning een kenmerk mee, en de rest werkt vanzelf. Het formulier laadt alleen op uw eigen website.</p>
            </Faq>
            <Faq q="Wat zie ik als er een aanvraag binnenkomt?">
              <p>Een e-mail met een samenvatting en een link, én de aanvraag verschijnt in het dashboard. Telefoon en e-mail van de aanvrager staan direct bovenaan.</p>
            </Faq>
            <Faq q="Moet ik het gebruiken zoals het nu is?">
              <p>Nee, dit is een prototype. We willen juist van makelaars horen welke eisen, groepen en schermen ze missen. Prijs en voorwaarden zijn nog niet bepaald.</p>
            </Faq>
            <Faq q="Wie kan de gegevens zien?">
              <p>Alleen de ingelogde medewerkers van uw kantoor. De technische partijen die het systeem draaien (hosting, database, doorsturen van de mail) verwerken de gegevens als verwerker; die afspraken worden vastgelegd voordat er echte aanvragen binnenkomen.</p>
            </Faq>
            <Faq q="Wat als de AI iets verkeerds zegt?">
              <p>Daarom staat de originele tekst altijd ernaast, is de AI standaard uit, kan hij nooit een groep wijzigen en verstuurt hij niets. Een concept is alleen een voorstel.</p>
            </Faq>
          </div>
        </section>

        {/* Afsluiter */}
        <section className="bg-gradient-to-r from-brand-800 to-brand-700 text-white">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-5 px-4 py-12 sm:flex-row sm:items-center sm:px-6">
            <div>
              <h2 className="text-2xl font-semibold">Zelf proberen?</h2>
              <p className="mt-1 text-brand-100">Dien een verzonnen aanvraag in op een demo-woningpagina en kijk hoe die in het dashboard verschijnt.</p>
            </div>
            <Link href="/demo-host.html" className="inline-flex min-h-12 items-center rounded-md bg-white px-6 font-medium text-brand-900 hover:bg-brand-50">
              Open de demo
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
