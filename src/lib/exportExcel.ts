import * as XLSX from "xlsx";
import {
  type ExportOptions,
  computeKPIs,
  drugBreakdown,
  departmentBreakdown,
  monthlyTrend,
  hospitalBreakdown,
  round,
  buildFilename,
} from "./exportUtils";

export function generateExcelReport(opts: ExportOptions) {
  const { events, level, hospitalName, dateRange, showCost, hospitals } = opts;
  const wb = XLSX.utils.book_new();
  const period = [dateRange.from ?? "Start", dateRange.to ?? "End"].join(" → ");

  // ── KPI Summary ──
  const kpis = computeKPIs(events, showCost);
  const kpiRows = [
    { Metric: "Report Level", Value: level === "system" ? "System (All Hospitals)" : `Hospital: ${hospitalName ?? ""}` },
    { Metric: "Period", Value: period },
    ...kpis.map((k) => ({ Metric: k.metric, Value: k.value })),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kpiRows), "KPI Summary");

  // ── Hospital / Department Breakdown ──
  if (level === "system") {
    const rows = hospitalBreakdown(events, hospitals).map((h) => {
      const row: Record<string, string | number> = {
        Hospital: h.name, "Waste Events": h.count, "Volume Wasted (ml)": round(h.volume), "Unique Drugs": h.uniqueDrugs,
      };
      if (showCost) row["Estimated Cost (€)"] = round(h.cost);
      return row;
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Hospital Breakdown");
  } else {
    const rows = departmentBreakdown(events).map((d) => {
      const row: Record<string, string | number> = {
        Department: d.department, "Waste Events": d.count, "Volume Wasted (ml)": round(d.volume),
      };
      if (showCost) row["Estimated Cost (€)"] = round(d.cost);
      return row;
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Department Breakdown");
  }

  // ── Drug Breakdown ──
  const drugRows = drugBreakdown(events).map((d) => {
    const row: Record<string, string | number> = {
      Drug: d.name, "Waste Events": d.count, "Volume Wasted (ml)": round(d.volume),
    };
    if (showCost) {
      row["Estimated Cost (€)"] = round(d.cost);
      row["Avg Cost/Event (€)"] = d.count > 0 ? round(d.cost / d.count) : 0;
    }
    return row;
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(drugRows), level === "system" ? "Drug Breakdown (System)" : "Drug Breakdown");

  // ── Monthly Trend ──
  const trendRows = monthlyTrend(events).map((m) => {
    const row: Record<string, string | number> = {
      Month: m.month, "Waste Events": m.count, "Volume (ml)": round(m.volume),
    };
    if (showCost) row["Cost (€)"] = round(m.cost);
    return row;
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(trendRows), "Monthly Trend");

  // ── Raw Events ──
  const rawRows = events.map((e) => {
    const row: Record<string, string | number> = {
      "Event ID": e.id, Date: e.date.toISOString().slice(0, 10), Hospital: e.hospitalName,
      Department: e.department, Drug: e.drugName, "Volume (ml)": e.volumeMl, Reason: e.reason,
    };
    if (showCost) row["Cost (€)"] = e.costEur;
    return row;
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rawRows), "Raw Events");

  XLSX.writeFile(wb, buildFilename(level, hospitalName, "xlsx"));
}
