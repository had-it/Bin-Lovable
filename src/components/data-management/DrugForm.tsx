import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { ExcelImport, ColumnDef } from "./ExcelImport";

const DRUG_COLUMNS: ColumnDef[] = [
  { key: "drugid", label: "Drug ID", aliases: ["DrugID", "drug_id", "id"], required: true },
  { key: "name", label: "Name", aliases: ["Name", "drug_name", "drugName"] },
  { key: "strength", label: "Strength (mg/ml)", aliases: ["Strength", "strength_mg"] },
  { key: "volume", label: "Volume (ml)", aliases: ["Volume", "volume_ml"] },
  { key: "cost", label: "Unit Cost (€)", aliases: ["Cost", "unit_cost", "price"] },
];

interface DrugRow {
  drugid: string;
  name: string | null;
  strength: number | null;
  volume: number | null;
  cost: number | null;
}

export function DrugForm() {
  const [drugs, setDrugs] = useState<DrugRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDrugs = async () => {
    setLoading(true);
    const { data } = await supabase.from("drugs_view" as any).select("*").order("name");
    setDrugs((data as unknown as DrugRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchDrugs(); }, []);

  const handleImportDrugs = async (rows: Record<string, string>[]) => {
    let success = 0, failed = 0;
    for (const row of rows) {
      if (!row.drugid) { failed++; continue; }
      const { error } = await supabase.from("drugs").insert({
        drugid: row.drugid,
        name: row.name || null,
        strength: row.strength ? parseFloat(row.strength) : null,
        volume: row.volume ? parseFloat(row.volume) : null,
        cost: row.cost ? parseFloat(row.cost) : null,
      });
      if (error) failed++; else success++;
    }
    fetchDrugs();
    return { success, failed };
  };

  return (
    <div className="space-y-6">
      <ExcelImport title="Import Drugs from CSV / Excel" columns={DRUG_COLUMNS} onImport={handleImportDrugs} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Drug List</CardTitle>
          <p className="text-sm text-muted-foreground">Drugs are read-only. Use the import above to add or update entries.</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="border rounded-lg overflow-auto max-h-80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Drug ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Strength</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Cost (€)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drugs.map((d) => (
                    <TableRow key={d.drugid}>
                      <TableCell className="font-mono text-xs">{d.drugid}</TableCell>
                      <TableCell>{d.name}</TableCell>
                      <TableCell>{d.strength ?? "—"}</TableCell>
                      <TableCell>{d.volume ?? "—"}</TableCell>
                      <TableCell>{d.cost != null ? `€${d.cost}` : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
