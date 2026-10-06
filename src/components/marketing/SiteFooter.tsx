import Logo from "@/components/brand/Logo";

export default function SiteFooter() {
  return (
    <footer className="bg-brand-900 text-brand-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <Logo light className="text-white" />
          <p className="mt-2 max-w-md text-sm text-brand-200">
            Een prototype voor een minorproject. De dienst is nog niet openbaar en nog niet juridisch getoetst; alle voorbeelden op deze pagina zijn verzonnen.
          </p>
        </div>
        <p className="text-sm text-brand-200">Aanvragen, gestructureerd en compleet. De makelaar beslist.</p>
      </div>
    </footer>
  );
}
