import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aanvragen – RentalFlowAI",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="nl" className="min-h-screen bg-slate-50">
      {children}
    </div>
  );
}
