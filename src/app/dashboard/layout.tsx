import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aanvragen – RentalFlowAI",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="nl" className="mx-auto min-h-screen max-w-4xl px-4 py-6 sm:px-6">
      {children}
    </div>
  );
}
