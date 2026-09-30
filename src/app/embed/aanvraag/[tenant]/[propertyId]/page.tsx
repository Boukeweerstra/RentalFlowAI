import { headers } from "next/headers";
import ApplicationForm from "@/components/ApplicationForm";
import RequirementsPanel from "@/components/RequirementsPanel";
import { configProvider } from "@/lib/config";
import { getDict, resolveLang } from "@/lib/i18n";
import { buildFormModel } from "@/lib/form-model";
import { PRIVACY_VERSION } from "@/lib/validate-application";

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function EmbedAanvraagPage({
  params,
  searchParams,
}: PageProps<"/embed/aanvraag/[tenant]/[propertyId]">) {
  const { tenant: tenantId, propertyId } = await params;
  const query = await searchParams;
  const lang = resolveLang(first(query.lang), (await headers()).get("accept-language"));
  const t = getDict(lang);

  // Hints uit het widget (data-rent / data-address); alleen gebruikt bij test-tenants.
  const rentNum = Number(first(query.rent));
  const hints = {
    rent: Number.isFinite(rentNum) && rentNum > 0 && rentNum <= 100_000 ? rentNum : undefined,
    address: first(query.address)?.slice(0, 200),
  };

  const [tenant, config] = await Promise.all([
    configProvider.getTenant(tenantId),
    configProvider.getProperty(tenantId, propertyId, hints),
  ]);

  if (!tenant || !config) {
    return (
      <main lang={lang} className="mx-auto max-w-xl p-6">
        <h1 className="text-xl font-semibold">{t.notFoundTitle}</h1>
        <p className="mt-2 text-zinc-600">{t.notFoundBody}</p>
      </main>
    );
  }

  const model = buildFormModel(config);
  // Hints alleen doorgeven aan het formulier als de config ze ook echt gebruikt (test-tenant).
  const useHints = config.source === "widget_hints";

  return (
    <main lang={lang} className="mx-auto max-w-xl space-y-6 p-4 sm:p-6">
      {/* pr-12: ruimte voor de sluitknop van het widget rechtsboven */}
      <header className="pr-12">
        <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
        <p className="mt-1 text-zinc-700">{config.address}</p>
        <p className="mt-2 text-sm text-zinc-600">{t.intro}</p>
      </header>
      <RequirementsPanel config={config} lang={lang} />
      <ApplicationForm
        config={config}
        model={model}
        lang={lang}
        privacyPolicyUrl={tenant.privacyPolicyUrl}
        privacyVersion={PRIVACY_VERSION}
        hints={useHints ? hints : undefined}
      />
    </main>
  );
}
