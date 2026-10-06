import { notFound } from "next/navigation";
import DashboardBoard from "@/components/dashboard/DashboardBoard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { fixtureApplications, fixtureEvents } from "@/lib/dashboard/fixtures";

/**
 * Voorbeeld van het dashboard met verzonnen gegevens, zonder inlog. Alleen voor lokaal ontwikkelen en testen
 * van het uiterlijk; in productie bestaat deze pagina niet (en de proxy laat haar daar ook niet zonder inlog toe).
 */
export default function DashboardPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main>
      <DashboardHeader officeNames={["Demo Makelaardij"]} email="demo@example.com" preview />
      <DashboardBoard
        initial={fixtureApplications}
        organizations={{ "00000000-0000-4000-8000-000000000001": "Demo Makelaardij" }}
        previewEvents={fixtureEvents}
        preview
      />
    </main>
  );
}
