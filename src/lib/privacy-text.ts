import type { Lang } from "@/lib/schema";

/**
 * Privacyverklaring voor woningzoekers. Let op:
 *  - Dit is een CONCEPT, geschreven door een ontwikkelaar en niet getoetst door een jurist. Zet PRIVACY_IS_DRAFT op false
 *    pas na juridische controle (zie docs/stappenplan.md, fase D). De pagina toont tot die tijd een waarschuwing.
 *  - Wijzig je de tekst inhoudelijk, verhoog dan PRIVACY_VERSION in validate-application.ts: die versie wordt per aanvraag
 *    vastgelegd bij de toestemming.
 *  - PRIVACY_RETENTION_MONTHS moet gelijk blijven aan `organizations.retention_months` in de database (standaard 6).
 */
export const PRIVACY_IS_DRAFT = true;
export const PRIVACY_RETENTION_MONTHS = 6;

export type PrivacySection = { heading: string; paragraphs?: string[]; items?: string[] };
export type PrivacyText = { title: string; draftNotice: string; intro: string; sections: PrivacySection[]; updated: string };

export function buildPrivacyText(lang: Lang, office: string, contactEmail?: string): PrivacyText {
  const months = PRIVACY_RETENTION_MONTHS;
  if (lang === "en") {
    return {
      title: `Privacy statement – rental application at ${office}`,
      draftNotice:
        "This is a draft and has not yet been reviewed by a legal professional. Details may change before the service is used for real applications.",
      intro: `When you submit a rental application through this form, ${office} receives your details. This statement explains what happens with them.`,
      sections: [
        {
          heading: "Who is responsible",
          paragraphs: [
            `${office} decides why and how your data is used (the controller). RentalFlowAI provides the form and the dashboard as a processor on behalf of ${office}.`,
          ],
        },
        {
          heading: "Which data we collect",
          items: [
            "Name, e-mail address and phone number, and (if asked) your age.",
            "Income type and monthly income, employment duration, probation period, and whether you are a student.",
            "Your living situation: number of occupants, housemates, pets, desired start date and lease period, and whether a guarantor is available.",
            "Residence status, only if the property requires it.",
            "Your own explanation (free text). Please do not include sensitive data such as health information.",
            "We do not ask for a copy of your ID or your citizen service number (BSN) in this form.",
          ],
        },
        {
          heading: "What we use it for",
          paragraphs: [
            `To assess your application for this property and to contact you. The legal basis is your consent and taking steps at your request before entering into a rental agreement.`,
          ],
        },
        {
          heading: "First check by rules",
          paragraphs: [
            "Your answers are compared with the requirements of the property using fixed rules. The result (suitable, to be assessed manually, or not matching) is only a first indication for the agent. The computer never rejects anyone: a person at the office always decides on your application.",
          ],
        },
        {
          heading: "Retention",
          paragraphs: [
            `Your application is stored for at most ${months} months and then deleted automatically from the dashboard. The office can delete it earlier. Copies in mailboxes or spreadsheets used by the office are deleted by the office as well.`,
          ],
        },
        {
          heading: "Who processes your data",
          items: [
            `${office}, which reads your application.`,
            "Supabase (database, European region), Vercel (hosting) and Make.com (forwarding the notification), as processors of RentalFlowAI.",
            "Google (spreadsheet and mailbox of the office), used by the office.",
            "Upstash and, if enabled, Cloudflare Turnstile, to prevent abuse of the form; they do not receive your application content.",
            "Some of these providers may process data outside the European Economic Area, with appropriate safeguards such as standard contractual clauses.",
          ],
        },
        {
          heading: "Your rights",
          paragraphs: [
            "You can ask for access to your data, correction, deletion, restriction or to object, and you can withdraw your consent at any time. You can also file a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens).",
            contactEmail
              ? `Send your request to ${contactEmail}.`
              : `Send your request to ${office}, using the contact details in the property listing.`,
          ],
        },
      ],
      updated: "Version 2026-10-v1 (draft)",
    };
  }
  return {
    title: `Privacyverklaring – huuraanvraag bij ${office}`,
    draftNotice:
      "Dit is een concept en is nog niet gecontroleerd door een jurist. De inhoud kan nog wijzigen voordat de dienst voor echte aanvragen wordt gebruikt.",
    intro: `Als u via dit formulier een huuraanvraag doet, ontvangt ${office} uw gegevens. In deze verklaring leest u wat er met die gegevens gebeurt.`,
    sections: [
      {
        heading: "Wie is verantwoordelijk",
        paragraphs: [
          `${office} bepaalt waarom en hoe uw gegevens worden gebruikt (de verwerkingsverantwoordelijke). RentalFlowAI levert het formulier en het dashboard als verwerker, in opdracht van ${office}.`,
        ],
      },
      {
        heading: "Welke gegevens we vragen",
        items: [
          "Naam, e-mailadres en telefoonnummer, en (als daarom wordt gevraagd) uw leeftijd.",
          "Soort inkomen en maandinkomen, duur van het dienstverband, proeftijd en of u student bent.",
          "Uw woonsituatie: aantal bewoners, medebewoners, huisdieren, gewenste ingangsdatum en huurperiode, en of er een garantsteller is.",
          "Verblijfsstatus, alleen als de woning daarom vraagt.",
          "Uw eigen toelichting (vrije tekst). Vermeld hierin geen gevoelige gegevens, zoals gezondheidsgegevens.",
          "We vragen in dit formulier geen kopie van uw identiteitsbewijs en geen burgerservicenummer (BSN).",
        ],
      },
      {
        heading: "Waarvoor gebruiken we ze",
        paragraphs: [
          "Om uw aanvraag voor deze woning te beoordelen en contact met u op te nemen. De grondslag is uw toestemming en het nemen van stappen op uw verzoek voordat een huurovereenkomst wordt gesloten.",
        ],
      },
      {
        heading: "Eerste check met regels",
        paragraphs: [
          "Uw antwoorden worden met vaste regels vergeleken met de eisen van de woning. De uitkomst (geschikt, zelf te beoordelen of niet passend) is alleen een eerste indicatie voor de makelaar. De computer wijst nooit iemand af: een medewerker van het kantoor beslist altijd over uw aanvraag.",
        ],
      },
      {
        heading: "Bewaartermijn",
        paragraphs: [
          `Uw aanvraag wordt maximaal ${months} maanden bewaard en daarna automatisch uit het dashboard verwijderd. Het kantoor kan haar eerder verwijderen. Kopieën in mailboxen of spreadsheets van het kantoor verwijdert het kantoor eveneens.`,
        ],
      },
      {
        heading: "Wie verwerkt uw gegevens",
        items: [
          `${office}, die uw aanvraag leest.`,
          "Supabase (database, Europese regio), Vercel (hosting) en Make.com (doorsturen van de melding), als verwerkers van RentalFlowAI.",
          "Google (spreadsheet en mailbox van het kantoor), in gebruik bij het kantoor.",
          "Upstash en, als dat aan staat, Cloudflare Turnstile, tegen misbruik van het formulier; zij ontvangen niet de inhoud van uw aanvraag.",
          "Een deel van deze partijen kan gegevens buiten de Europese Economische Ruimte verwerken, met passende waarborgen zoals standaardcontractbepalingen.",
        ],
      },
      {
        heading: "Uw rechten",
        paragraphs: [
          "U kunt vragen om inzage, correctie, verwijdering, beperking van de verwerking of bezwaar maken, en u kunt uw toestemming altijd intrekken. U kunt ook een klacht indienen bij de Autoriteit Persoonsgegevens.",
          contactEmail
            ? `Stuur uw verzoek naar ${contactEmail}.`
            : `Stuur uw verzoek naar ${office}, via de contactgegevens in de woningadvertentie.`,
        ],
      },
    ],
    updated: "Versie 2026-10-v1 (concept)",
  };
}
