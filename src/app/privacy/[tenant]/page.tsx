import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { configProvider } from "@/lib/config";
import { resolveLang } from "@/lib/i18n";
import { PRIVACY_IS_DRAFT, buildPrivacyText } from "@/lib/privacy-text";

export const metadata: Metadata = { title: "Privacyverklaring", robots: { index: false } };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function PrivacyPage({ params, searchParams }: PageProps<"/privacy/[tenant]">) {
  const { tenant: tenantId } = await params;
  const query = await searchParams;
  const tenant = await configProvider.getTenant(tenantId).catch(() => null);
  if (!tenant) notFound();

  const lang = resolveLang(first(query.lang), (await headers()).get("accept-language"));
  const text = buildPrivacyText(lang, tenant.name, tenant.notifyEmail);

  return (
    <main lang={lang} className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">{text.title}</h1>
      {PRIVACY_IS_DRAFT && (
        <p role="note" className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-950">{text.draftNotice}</p>
      )}
      <p className="mt-4">{text.intro}</p>
      {text.sections.map((s) => (
        <section key={s.heading} className="mt-6" aria-labelledby={`h-${s.heading}`}>
          <h2 id={`h-${s.heading}`} className="text-lg font-semibold">{s.heading}</h2>
          {s.paragraphs?.map((p) => (<p key={p} className="mt-2">{p}</p>))}
          {s.items && (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {s.items.map((i) => (<li key={i}>{i}</li>))}
            </ul>
          )}
        </section>
      ))}
      <p className="mt-8 text-sm text-zinc-700">{text.updated}</p>
    </main>
  );
}
