import type { Lang, PropertyConfig } from "@/lib/schema";
import { getDict } from "@/lib/i18n";
import { requirementItems } from "@/lib/requirement-items";

/** Toont transparant wat voor deze woning nodig is. Geen server-only code: ook bruikbaar als voorbeeld in het scherm van de makelaar. */
export default function RequirementsPanel({
  config,
  lang,
}: {
  config: Pick<PropertyConfig, "criteria" | "rent" | "documentsLater">;
  lang: Lang;
}) {
  const t = getDict(lang);
  const items = requirementItems(config, lang);

  return (
    <section aria-labelledby="req-title" className="rounded-xl border border-accent-100 bg-accent-50 p-4 sm:p-5">
      <h2 id="req-title" className="font-semibold text-accent-700">{t.requirementsTitle}</h2>
      <ul className="mt-3 space-y-1.5 text-sm text-zinc-800">
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden="true" className="font-semibold text-accent-600">✓</span>
            <span>{i}</span>
          </li>
        ))}
      </ul>
      {config.documentsLater.length > 0 && (
        <div className="mt-4 border-t border-accent-100 pt-3">
          <h3 className="text-sm font-semibold text-zinc-900">{t.documentsLaterTitle}</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-zinc-800">
            {config.documentsLater.map((d) => (
              <li key={d}>{t.documents[d]}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-zinc-600">{t.documentsLaterNote}</p>
        </div>
      )}
    </section>
  );
}
