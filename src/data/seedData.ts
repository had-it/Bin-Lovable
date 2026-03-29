// Seed data for PharmWaste Dashboard

export const HOSPITALS = [
  { id: "h1", name: "St. Mary's General Hospital" },
  { id: "h2", name: "University Medical Center" },
  { id: "h3", name: "City Regional Hospital" },
] as const;

export const DEPARTMENTS = [
  "Oncology",
  "ICU",
  "Surgery",
  "Pediatrics",
  "Emergency",
] as const;

export const DISPOSAL_REASONS = [
  "Expired",
  "Contaminated",
  "Patient Refusal",
  "Preparation Surplus",
  "Damaged",
] as const;

export interface Drug {
  id: string;
  name: string;
  unitCostEur: number;
}

export const DRUGS: Drug[] = [
  { id: "d01", name: "Paracetamol 500mg", unitCostEur: 0.12 },
  { id: "d02", name: "Amoxicillin 250mg", unitCostEur: 0.35 },
  { id: "d03", name: "Ibuprofen 400mg", unitCostEur: 0.18 },
  { id: "d04", name: "Morphine Sulfate 10mg", unitCostEur: 4.5 },
  { id: "d05", name: "Cisplatin 50mg", unitCostEur: 28.0 },
  { id: "d06", name: "Doxorubicin 10mg", unitCostEur: 35.0 },
  { id: "d07", name: "Methotrexate 25mg", unitCostEur: 12.5 },
  { id: "d08", name: "Insulin Glargine 100U", unitCostEur: 22.0 },
  { id: "d09", name: "Heparin 5000IU", unitCostEur: 8.75 },
  { id: "d10", name: "Vancomycin 500mg", unitCostEur: 15.0 },
  { id: "d11", name: "Fentanyl 50mcg", unitCostEur: 6.2 },
  { id: "d12", name: "Propofol 200mg", unitCostEur: 9.5 },
  { id: "d13", name: "Epinephrine 1mg", unitCostEur: 3.8 },
  { id: "d14", name: "Ceftriaxone 1g", unitCostEur: 5.5 },
  { id: "d15", name: "Omeprazole 20mg", unitCostEur: 0.45 },
  { id: "d16", name: "Diazepam 5mg", unitCostEur: 1.2 },
  { id: "d17", name: "Cyclophosphamide 200mg", unitCostEur: 18.0 },
  { id: "d18", name: "Remifentanil 1mg", unitCostEur: 14.0 },
  { id: "d19", name: "Norepinephrine 4mg", unitCostEur: 7.5 },
  { id: "d20", name: "5-Fluorouracil 500mg", unitCostEur: 3.2 },
  { id: "d21", name: "Atropine 0.5mg", unitCostEur: 2.1 },
  { id: "d22", name: "Ketamine 50mg", unitCostEur: 4.0 },
];

export interface WasteEvent {
  id: string;
  date: Date;
  hospitalId: string;
  hospitalName: string;
  department: string;
  drugId: string;
  drugName: string;
  volumeMl: number;
  costEur: number;
  reason: string;
}

// Seeded random number generator for reproducibility
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateWasteEvents(): WasteEvent[] {
  const rand = seededRandom(42);
  const events: WasteEvent[] = [];
  const startDate = new Date(2025, 7, 1); // Aug 2025
  const endDate = new Date(2026, 1, 1); // Feb 2026

  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  for (let i = 0; i < 220; i++) {
    const hospital = HOSPITALS[Math.floor(rand() * HOSPITALS.length)];
    const department = DEPARTMENTS[Math.floor(rand() * DEPARTMENTS.length)];
    const drug = DRUGS[Math.floor(rand() * DRUGS.length)];
    const reason = DISPOSAL_REASONS[Math.floor(rand() * DISPOSAL_REASONS.length)];
    const dayOffset = Math.floor(rand() * totalDays);
    const date = new Date(startDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const volumeMl = Math.round((rand() * 450 + 50) * 10) / 10;
    const costEur = Math.round(volumeMl * drug.unitCostEur * (0.5 + rand() * 1.0) * 100) / 100;

    events.push({
      id: `we-${String(i + 1).padStart(3, "0")}`,
      date,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      department,
      drugId: drug.id,
      drugName: drug.name,
      volumeMl,
      costEur,
      reason,
    });
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export const wasteEvents = generateWasteEvents();

// Helper to filter events
export function filterEvents(
  events: WasteEvent[],
  filters: {
    hospital?: string;
    department?: string;
    drug?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }
): WasteEvent[] {
  return events.filter((e) => {
    if (filters.hospital && e.hospitalId !== filters.hospital) return false;
    if (filters.department && e.department !== filters.department) return false;
    if (filters.drug && e.drugId !== filters.drug) return false;
    if (filters.dateFrom && e.date < filters.dateFrom) return false;
    if (filters.dateTo && e.date > filters.dateTo) return false;
    return true;
  });
}
