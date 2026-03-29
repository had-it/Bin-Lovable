import type { WasteEvent } from "@/data/seedData";

export interface ExportOptions {
  events: WasteEvent[];
  level: "system" | "hospital";
  hospitalName?: string;
  dateRange: { from?: string; to?: string };
  showCost: boolean;
  hospitals: { id: string; name: string }[];
}

export interface KPI {
  metric: string;
  value: number | string;
}

export interface DrugRow {
  name: string;
  count: number;
  volume: number;
  cost: number;
}

export interface DeptRow {
  department: string;
  count: number;
  volume: number;
  cost: number;
}

export interface MonthRow {
  month: string;
  count: number;
  volume: number;
  cost: number;
}

export function computeKPIs(events: WasteEvent[], showCost: boolean): KPI[] {
  const total = events.length;
  const volume = events.reduce((s, e) => s + e.volumeMl, 0);
  const cost = events.reduce((s, e) => s + e.costEur, 0);
  const uniqueDrugs = new Set(events.map((e) => e.drugId)).size;
  const uniqueDepts = new Set(events.map((e) => e.department)).size;
  const expired = events.filter((e) => e.reason === "Expired").length;

  const kpis: KPI[] = [
    { metric: "Total Waste Events", value: total },
    { metric: "Total Volume (ml)", value: round(volume) },
    { metric: "Unique Drugs", value: uniqueDrugs },
    { metric: "Unique Departments", value: uniqueDepts },
    { metric: "Expired Events", value: expired },
    { metric: "Expired %", value: total > 0 ? `${((expired / total) * 100).toFixed(1)}%` : "0%" },
  ];

  if (showCost) {
    kpis.push(
      { metric: "Total Estimated Cost (€)", value: round(cost) },
      { metric: "Avg Cost per Event (€)", value: total > 0 ? round(cost / total) : 0 },
    );
  }

  return kpis;
}

export function drugBreakdown(events: WasteEvent[]): DrugRow[] {
  const map = new Map<string, DrugRow>();
  for (const e of events) {
    const d = map.get(e.drugId) ?? { name: e.drugName, volume: 0, cost: 0, count: 0 };
    d.volume += e.volumeMl;
    d.cost += e.costEur;
    d.count += 1;
    map.set(e.drugId, d);
  }
  return Array.from(map.values()).sort((a, b) => b.volume - a.volume);
}

export function departmentBreakdown(events: WasteEvent[]): DeptRow[] {
  const map = new Map<string, DeptRow>();
  for (const e of events) {
    const d = map.get(e.department) ?? { department: e.department, volume: 0, cost: 0, count: 0 };
    d.volume += e.volumeMl;
    d.cost += e.costEur;
    d.count += 1;
    map.set(e.department, d);
  }
  return Array.from(map.values()).sort((a, b) => b.volume - a.volume);
}

export function monthlyTrend(events: WasteEvent[]): MonthRow[] {
  const map = new Map<string, MonthRow>();
  for (const e of events) {
    const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, "0")}`;
    const m = map.get(key) ?? { month: key, count: 0, volume: 0, cost: 0 };
    m.count += 1;
    m.volume += e.volumeMl;
    m.cost += e.costEur;
    map.set(key, m);
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export function hospitalBreakdown(events: WasteEvent[], hospitals: { id: string; name: string }[]) {
  const ids = [...new Set(events.map((e) => e.hospitalId))];
  return ids.map((hId) => {
    const hEvents = events.filter((e) => e.hospitalId === hId);
    return {
      name: hospitals.find((h) => h.id === hId)?.name ?? hId,
      count: hEvents.length,
      volume: hEvents.reduce((s, e) => s + e.volumeMl, 0),
      cost: hEvents.reduce((s, e) => s + e.costEur, 0),
      uniqueDrugs: new Set(hEvents.map((e) => e.drugId)).size,
    };
  });
}

export function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function buildFilename(level: "system" | "hospital", hospitalName?: string, ext = "xlsx"): string {
  const date = new Date().toISOString().slice(0, 10);
  if (level === "system") return `system-report-${date}.${ext}`;
  return `${(hospitalName ?? "hospital").replace(/\s+/g, "-").toLowerCase()}-report-${date}.${ext}`;
}
