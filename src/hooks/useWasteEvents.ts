import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import type { WasteEvent } from "@/data/seedData";

interface RawWaste {
  wasteid: string;
  volume: number | null;
  time: string | null;
  expiry_date: string | null;
  binid: string | null;
  drugid: string | null;
}

interface RawBin {
  binid: string;
  department: string | null;
  name: string | null;
}

interface RawDrug {
  drugid: string;
  name: string | null;
  cost: number | null;
  volume: number | null;
}

const HOSPITAL_TABLES = [
  {
    id: "karolinska",
    name: "Karolinska University Hospital",
    wasteView: "karolinska_university_hospital_waste_view",
    binsView: "karolinska_university_hospital_bins_view",
  },
  {
    id: "capio",
    name: "Capio St Görans Sjukhus",
    wasteView: "capio_st_görans_sjukhus_waste_view",
    binsView: "capio_st_görans_sjukhus_bins_view",
  },
] as const;

export function useWasteEvents() {
  const [events, setEvents] = useState<WasteEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { activeRole, impersonatedUser } = useRole();

  const userHospitalId = impersonatedUser?.hospital ?? user?.hospital ?? "all";
  const userDepartment = impersonatedUser?.department ?? user?.department ?? null;

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const hospitalsToFetch =
          userHospitalId === "all"
            ? HOSPITAL_TABLES
            : HOSPITAL_TABLES.filter((h) => h.id === userHospitalId);

        // Fetch drugs + all hospital bins/waste in parallel
        const [drugsResult, ...hospitalResults] = await Promise.all([
          supabase.from("drugs_view" as any).select("*"),
          ...hospitalsToFetch.flatMap((h) => [
            supabase.from(h.binsView as any).select("*"),
            supabase.from(h.wasteView as any).select("*"),
          ]),
        ]);

        if (drugsResult.error) throw drugsResult.error;
        const drugsMap = new Map<string, RawDrug>();
        ((drugsResult.data ?? []) as unknown as RawDrug[]).forEach((d) =>
          drugsMap.set(d.drugid, d)
        );

        const allEvents: WasteEvent[] = [];

        for (let i = 0; i < hospitalsToFetch.length; i++) {
          const hospital = hospitalsToFetch[i];
          const binsRes = hospitalResults[i * 2];
          const wasteRes = hospitalResults[i * 2 + 1];
          if (binsRes.error) throw binsRes.error;
          if (wasteRes.error) throw wasteRes.error;

          const binsMap = new Map<string, RawBin>();
          ((binsRes.data ?? []) as unknown as RawBin[]).forEach((b) =>
            binsMap.set(b.binid, b)
          );

          for (const w of (wasteRes.data ?? []) as unknown as RawWaste[]) {
            const bin = w.binid ? binsMap.get(w.binid) : undefined;
            const drug = w.drugid ? drugsMap.get(w.drugid) : undefined;
            const volume = w.volume ?? 0;
            const drugCost = drug?.cost ?? 0;
            const drugVolume = drug?.volume ?? 1;
            const costEur = Math.round((volume / drugVolume) * drugCost * 100) / 100;

            const wasteTime = w.time ? new Date(w.time) : new Date();
            const expiryDate = w.expiry_date ? new Date(w.expiry_date) : null;
            const isExpired = expiryDate && expiryDate < wasteTime;

            allEvents.push({
              id: w.wasteid,
              date: wasteTime,
              hospitalId: hospital.id,
              hospitalName: hospital.name,
              department: bin?.department ?? "Unknown",
              drugId: w.drugid ?? "unknown",
              drugName: drug?.name ?? "Unknown Drug",
              volumeMl: volume,
              costEur,
              reason: isExpired ? "Expired" : "Preparation Surplus",
            });
          }
        }

        if (!cancelled) {
          allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
          setEvents(allEvents);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? "Failed to fetch data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [userHospitalId]);

  const roleFilteredEvents = useMemo(() => {
    if (activeRole === "BinSight Admin" || activeRole === "Hospital Admin" || activeRole === "Hospital Manager") {
      return events;
    }
    if (userDepartment) {
      return events.filter((e) => e.department === userDepartment);
    }
    return events;
  }, [events, activeRole, userDepartment]);

  const hospitals = useMemo(() => {
    const map = new Map<string, string>();
    roleFilteredEvents.forEach((e) => map.set(e.hospitalId, e.hospitalName));
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [roleFilteredEvents]);

  const departments = useMemo(() => {
    return [...new Set(roleFilteredEvents.map((e) => e.department))].sort();
  }, [roleFilteredEvents]);

  const drugs = useMemo(() => {
    const map = new Map<string, string>();
    roleFilteredEvents.forEach((e) => map.set(e.drugId, e.drugName));
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [roleFilteredEvents]);

  return { events: roleFilteredEvents, loading, error, hospitals, departments, drugs };
}
