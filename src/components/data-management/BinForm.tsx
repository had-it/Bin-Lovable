import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ExcelImport, ColumnDef } from "./ExcelImport";

const BIN_COLUMNS: ColumnDef[] = [
  { key: "binid", label: "Bin ID", aliases: ["BinID", "bin_id", "id"], required: true },
  { key: "name", label: "Bin Name", aliases: ["Name", "bin_name", "binName"] },
  { key: "department", label: "Department", aliases: ["Department", "dept"] },
];

type BinsTable = "karolinska_university_hospital_bins" | "capio_st_görans_sjukhus_bins";

const BINS_VIEW_MAP: Record<BinsTable, string> = {
  "karolinska_university_hospital_bins": "karolinska_university_hospital_bins_view",
  "capio_st_görans_sjukhus_bins": "capio_st_görans_sjukhus_bins_view",
};

interface BinRow {
  binid: string;
  name: string | null;
  department: string | null;
}

export function BinForm({ binsTable }: { binsTable: BinsTable }) {
  const [bins, setBins] = useState<BinRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ binid: "", name: "", department: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchBins = async () => {
    setLoading(true);
    const { data } = await supabase.from(BINS_VIEW_MAP[binsTable] as any).select("*").order("department");
    setBins((data as unknown as BinRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchBins(); }, [binsTable]);

  const handleAdd = async () => {
    if (!form.binid) {
      toast({ title: "Bin ID is required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from(binsTable).insert({
      binid: form.binid,
      name: form.name || null,
      department: form.department || "",
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Failed to add bin", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Bin added" });
      setForm({ binid: "", name: "", department: "" });
      fetchBins();
    }
  };

  const handleImportBins = async (rows: Record<string, string>[]) => {
    let success = 0, failed = 0;
    for (const row of rows) {
      if (!row.binid) { failed++; continue; }
      const { error } = await supabase.from(binsTable).insert({
        binid: row.binid,
        name: row.name || null,
        department: row.department || "",
      });
      if (error) failed++; else success++;
    }
    fetchBins();
    return { success, failed };
  };

  // Derive unique departments from bins
  const departments = [...new Set(bins.map((b) => b.department).filter(Boolean))] as string[];

  return (
    <div className="space-y-6">
      <ExcelImport title="Import Bins from Excel" columns={BIN_COLUMNS} onImport={handleImportBins} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Bin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Input placeholder="Bin ID" value={form.binid} onChange={(e) => setForm({ ...form, binid: e.target.value })} />
            <Input placeholder="Bin Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
          <Button onClick={handleAdd} disabled={submitting}>
            <Plus className="h-4 w-4 mr-1" /> Add Bin
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Existing Bins & Departments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="border rounded-lg overflow-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Bin ID</TableHead>
                    <TableHead>Bin Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bins.map((b) => (
                    <TableRow key={b.binid}>
                      <TableCell>{b.department || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{b.binid}</TableCell>
                      <TableCell>{b.name || "—"}</TableCell>
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
