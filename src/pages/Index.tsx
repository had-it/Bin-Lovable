import { useState, useMemo, useRef } from "react";
import { Navigate } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { KPICards } from "@/components/KPICards";
import { TimeTrendChart } from "@/components/TimeTrendChart";
import { DepartmentChart } from "@/components/DepartmentChart";
import { TopDrugsChart } from "@/components/TopDrugsChart";
import { DisposalReasonsChart } from "@/components/DisposalReasonsChart";
import { BenchmarkChart } from "@/components/BenchmarkChart";
import { StackedCostChart } from "@/components/StackedCostChart";
import { FlaggedEvents } from "@/components/FlaggedEvents";
import { Recommendations } from "@/components/Recommendations";
import { DashboardFilters, type Filters } from "@/components/DashboardFilters";
import { filterEvents } from "@/data/seedData";
import { useWasteEvents } from "@/hooks/useWasteEvents";
import { useRole } from "@/contexts/RoleContext";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ExportReportDialog } from "@/components/ExportReportDialog";

const Index = () => {
  const { can } = useRole();
  const [filters, setFilters] = useState<Filters>({
    hospital: "",
    department: "",
    drug: "",
  });
  const [exportOpen, setExportOpen] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const { events: wasteEvents, loading, error, hospitals, departments, drugs } = useWasteEvents();

  const showCostData = can("view_cost_data");
  const showBenchmark = can("benchmarking");
  const showDrugList = can("view_drug_list");

  const filteredEvents = useMemo(
    () =>
      filterEvents(wasteEvents, {
        hospital: filters.hospital || undefined,
        department: filters.department || undefined,
        drug: filters.drug || undefined,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      }),
    [filters, wasteEvents]
  );


  // Hospital Admin has no analytics — redirect to Admin Management
  if (!can("analytics_dashboard")) {
    return <Navigate to="/data-management" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col w-full bg-muted/30">
      <TopNav />
      <main className="flex-1 p-8 space-y-8 overflow-auto max-w-[1400px] mx-auto w-full">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Monitor and analyze pharmaceutical waste across your facilities.</p>
          </div>
          {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading data…</div>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)} className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <ExportReportDialog open={exportOpen} onOpenChange={setExportOpen} events={wasteEvents} hospitals={hospitals} departments={departments} />
        </div>
        <div ref={dashboardRef} className="space-y-8">
          <DashboardFilters filters={filters} onChange={setFilters} hospitals={hospitals} departments={departments} drugs={drugs} />
          
          {/* KPI + Flagged row */}
          <div className={`grid grid-cols-1 ${showCostData ? "lg:grid-cols-[1fr_180px]" : ""} gap-6 items-start`}>
            <KPICards events={filteredEvents} showCost={showCostData} />
            {showCostData && <FlaggedEvents events={filteredEvents} />}
          </div>

          {/* Trend + Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <TimeTrendChart events={filteredEvents} />
            <Recommendations events={filteredEvents} showCost={showCostData} />
          </div>

          {/* Department + Disposal Reasons — always side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DepartmentChart events={filteredEvents} />
            <DisposalReasonsChart events={filteredEvents} />
          </div>

          {/* Drugs + Benchmark — only if available */}
          {(showDrugList || showBenchmark) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {showDrugList && <TopDrugsChart events={filteredEvents} />}
              {showBenchmark && <BenchmarkChart events={filteredEvents} />}
            </div>
          )}

          {showCostData && <StackedCostChart events={filteredEvents} />}
        </div>
      </main>
    </div>
  );
};

export default Index;
