import {
  type ExportOptions,
  computeKPIs,
  drugBreakdown,
  monthlyTrend,
  hospitalBreakdown,
  round,
  buildFilename,
} from "./exportUtils";

const HEADER_COLOR: [number, number, number] = [59, 130, 246];

export async function generatePdfReport(opts: ExportOptions) {
  const { events, level, hospitalName, dateRange, showCost, hospitals } = opts;
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  let y = 15;

  const addSectionTitle = (title: string) => {
    if (y > pdf.internal.pageSize.getHeight() - 40) { pdf.addPage(); y = 15; }
    pdf.setFontSize(13);
    pdf.setTextColor(30, 30, 30);
    pdf.text(title, 14, y);
    y += 6;
  };

  const addTable = (head: string[], body: string[][], theme: "grid" | "striped" = "striped") => {
    autoTable(pdf, {
      startY: y,
      head: [head],
      body,
      theme,
      headStyles: { fillColor: HEADER_COLOR, textColor: 255, fontStyle: theme === "grid" ? "bold" : undefined },
      styles: { fontSize: theme === "grid" ? 9 : 8, cellPadding: theme === "grid" ? 3 : 2.5 },
      margin: { left: 14 },
    });
    y = (pdf as any).lastAutoTable.finalY + 10;
  };

  // ── Title ──
  pdf.setFontSize(18);
  pdf.setTextColor(30, 30, 30);
  pdf.text(level === "system" ? "System-Level Waste Report" : `Hospital Report: ${hospitalName ?? ""}`, 14, y);
  y += 8;

  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Period: ${dateRange.from ?? "Start"} → ${dateRange.to ?? "End"}  |  Generated: ${new Date().toISOString().slice(0, 10)}  |  Events: ${events.length}`, 14, y);
  y += 10;

  // ── KPIs ──
  const kpis = computeKPIs(events, showCost);
  addTable(["Metric", "Value"], kpis.map((k) => [k.metric, String(k.value)]), "grid");

  // ── Hospital Breakdown (system only) ──
  if (level === "system") {
    addSectionTitle("Hospital Breakdown");
    const hRows = hospitalBreakdown(events, hospitals);
    const head = showCost
      ? ["Hospital", "Events", "Volume (ml)", "Unique Drugs", "Cost (€)"]
      : ["Hospital", "Events", "Volume (ml)", "Unique Drugs"];
    const body = hRows.map((h) => {
      const row = [h.name, String(h.count), round(h.volume).toLocaleString(), String(h.uniqueDrugs)];
      if (showCost) row.push(round(h.cost).toLocaleString());
      return row;
    });
    addTable(head, body);
  }

  // ── Drug Breakdown ──
  addSectionTitle("Drug-Level Breakdown");
  const drugs = drugBreakdown(events);
  const drugHead = showCost
    ? ["Drug", "Events", "Volume (ml)", "Cost (€)", "Avg Cost/Event (€)"]
    : ["Drug", "Events", "Volume (ml)"];
  const drugBody = drugs.map((d) => {
    const row = [d.name, String(d.count), round(d.volume).toLocaleString()];
    if (showCost) {
      row.push(round(d.cost).toLocaleString());
      row.push(d.count > 0 ? round(d.cost / d.count).toLocaleString() : "0");
    }
    return row;
  });
  addTable(drugHead, drugBody);

  // ── Monthly Trend ──
  addSectionTitle("Monthly Trend");
  const trend = monthlyTrend(events);
  const trendHead = showCost ? ["Month", "Events", "Volume (ml)", "Cost (€)"] : ["Month", "Events", "Volume (ml)"];
  const trendBody = trend.map((m) => {
    const row = [m.month, String(m.count), round(m.volume).toLocaleString()];
    if (showCost) row.push(round(m.cost).toLocaleString());
    return row;
  });
  addTable(trendHead, trendBody);

  pdf.save(buildFilename(level, hospitalName, "pdf"));
}
