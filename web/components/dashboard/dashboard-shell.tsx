import { DashboardFooter } from "./dashboard-footer";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSelectionProvider } from "./dashboard-selection-provider";
import { PlaceholderPanel } from "./placeholder-panel";
import { SelectionChrome } from "./selection-chrome";
import { KpiPanel } from "../kpis/kpi-panel";

export function DashboardShell() {
  return (
    <DashboardSelectionProvider>
      <div className="flex min-h-full flex-1 flex-col bg-zinc-100 dark:bg-zinc-950">
        <DashboardHeader />

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
          <section aria-label="Key performance indicators">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
                KPIs
              </h2>
              <SelectionChrome />
            </div>
            <KpiPanel />
          </section>

          <PlaceholderPanel
            title="World map"
            description="Interactive choropleth or markers — React Leaflet (ADR-005). Data from GET /covid/countries."
            minHeightClass="min-h-[280px] sm:min-h-[360px]"
          />

          <PlaceholderPanel
            title="Confirmed cases over time"
            description="Time-series chart for global or selected country — GET /covid/series or country series."
            minHeightClass="min-h-[220px] sm:min-h-[280px]"
          />
        </main>

        <DashboardFooter />
      </div>
    </DashboardSelectionProvider>
  );
}
