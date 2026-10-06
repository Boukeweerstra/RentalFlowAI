import { redirect } from "next/navigation";
import DashboardBoard from "@/components/dashboard/DashboardBoard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { APPLICATION_SELECT, rowToDash, type ApplicationRow } from "@/lib/dashboard/types";
import { createClient, getAuthedUser } from "@/lib/supabase/server";

type Membership = {
  organization_id: string;
  organizations: { name: string } | { name: string }[] | null;
};

const orgName = (m: Membership): string => {
  const o = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations;
  return o?.name ?? "Kantoor";
};

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  // Elke pagina controleert zelf de gebruiker; de proxy is alleen het eerste hek.
  const user = await getAuthedUser();
  if (!user) redirect("/login");

  const query = await searchParams;
  const focus = Array.isArray(query.application) ? query.application[0] : query.application;

  const supabase = await createClient();
  const [members, applications] = await Promise.all([
    supabase.from("members").select("organization_id, organizations(name)"),
    supabase
      .from("applications")
      .select(APPLICATION_SELECT)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const memberships = (members.data ?? []) as unknown as Membership[];
  const organizations = Object.fromEntries(memberships.map((m) => [m.organization_id, orgName(m)]));

  if (members.error || applications.error) {
    console.error("[dashboard] laden mislukt:", members.error?.code ?? applications.error?.code);
  }

  return (
    <main>
      <DashboardHeader officeNames={Object.values(organizations)} email={user.email} />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {memberships.length === 0 ? (
        <p role="alert" className="rounded-md bg-amber-50 p-4 text-amber-950">
          Uw account is nog niet gekoppeld aan een kantoor. Neem contact op met de beheerder.
        </p>
      ) : applications.error ? (
        <p role="alert" className="rounded-md bg-red-50 p-4 text-red-800">
          De aanvragen konden niet worden geladen. Ververs de pagina of probeer het later opnieuw.
        </p>
      ) : (
        <DashboardBoard
          initial={((applications.data ?? []) as unknown as ApplicationRow[]).map(rowToDash)}
          organizations={organizations}
          focusId={focus}
        />
      )}
      </div>
    </main>
  );
}
