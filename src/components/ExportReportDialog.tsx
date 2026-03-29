import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";
import type { WasteEvent } from "@/data/seedData";
import { filterEvents } from "@/data/seedData";
import { generateExcelReport } from "@/lib/exportExcel";
import { generatePdfReport } from "@/lib/exportPdf";
import type { ExportOptions } from "@/lib/exportUtils";
import { toast } from "@/hooks/use-toast";

type ExportLevel = "system" | "hospital";
type ExportFormat = "pdf" | "excel";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: WasteEvent[];
  hospitals: { id: string; name: string }[];
  departments: string[];
}

export function ExportReportDialog({ open, onOpenChange, events, hospitals, departments }: Props) {
  const { can } = useRole();
  const canSeeAllHospitals = can("view_all_hospitals");
  const showCost = can("view_cost_data");

  const [level, setLevel] = useState<ExportLevel>(canSeeAllHospitals ? "system" : "hospital");
  const [hospital, setHospital] = useState("");
  const [department, setDepartment] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [exportFormat, setExportFormat] = useState<ExportFormat>("excel");
  const [exporting, setExporting] = useState(false);

  const filteredEvents = useMemo(
    () => filterEvents(events, {
      hospital: level === "hospital" && hospital ? hospital : undefined,
      department: department || undefined,
      dateFrom,
      dateTo,
    }),
    [events, level, hospital, department, dateFrom, dateTo]
  );

  const handleExport = async () => {
    if (level === "hospital" && !hospital) {
      toast({ title: "Select a hospital", description: "Please choose a hospital for the export.", variant: "destructive" });
      return;
    }
    setExporting(true);
    try {
      const selectedHospitalName = hospital ? hospitals.find((h) => h.id === hospital)?.name ?? hospital : undefined;
      const dateRange = {
        from: dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined,
        to: dateTo ? format(dateTo, "yyyy-MM-dd") : undefined,
      };

      if (exportFormat === "excel") {
        generateExcelReport({
          events: filteredEvents,
          level,
          hospitalName: selectedHospitalName,
          dateRange,
          showCost,
          hospitals,
        });
      } else {
        await generatePdfReport({
          events: filteredEvents,
          level,
          hospitalName: selectedHospitalName,
          dateRange,
          showCost,
          hospitals,
        });
      }
      toast({ title: "Export complete", description: `Report exported as ${exportFormat.toUpperCase()}.` });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message ?? "Could not generate report.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  // departments available for selected hospital
  const availableDepts = level === "hospital" && hospital
    ? [...new Set(events.filter((e) => e.hospitalId === hospital).map((e) => e.department))].sort()
    : departments;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Export Report</DialogTitle>
          <DialogDescription>Configure scope and format for your export.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Export level */}
          {canSeeAllHospitals && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Report Level</label>
              <Select value={level} onValueChange={(v) => { setLevel(v as ExportLevel); setHospital(""); setDepartment(""); }}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System-level (all hospitals)</SelectItem>
                  <SelectItem value="hospital">Hospital-level</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Hospital selector for hospital-level */}
          {level === "hospital" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Hospital</label>
              <Select value={hospital} onValueChange={(v) => { setHospital(v); setDepartment(""); }}>
                <SelectTrigger className="bg-card">
                  <SelectValue placeholder="Select hospital" />
                </SelectTrigger>
                <SelectContent>
                  {hospitals.map((h) => (
                    <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Department filter (optional) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Department (optional)</label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                {availableDepts.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium text-foreground">From</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start bg-card", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd MMM yy") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium text-foreground">To</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start bg-card", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd MMM yy") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Format */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Format</label>
            <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
              <SelectTrigger className="bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">
                  <span className="flex items-center gap-2"><FileSpreadsheet className="h-4 w-4" /> Excel (.xlsx)</span>
                </SelectItem>
                <SelectItem value="pdf">
                  <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> PDF</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            {filteredEvents.length} events will be included in this report.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleExport} disabled={exporting} className="gap-2">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {exporting ? "Generating…" : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
