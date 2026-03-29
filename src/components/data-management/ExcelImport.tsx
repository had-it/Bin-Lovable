import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

export interface ColumnDef {
  key: string;
  label: string;
  aliases: string[]; // accepted column name variants from excel
  required?: boolean;
}

interface Props {
  title: string;
  columns: ColumnDef[];
  onImport: (rows: Record<string, string>[]) => Promise<{ success: number; failed: number }>;
}

export function ExcelImport({ title, columns, onImport }: Props) {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [stage, setStage] = useState<"upload" | "preview" | "done">("upload");
  const [submitting, setSubmitting] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const findColumn = (rawKey: string): string | null => {
    const lower = rawKey.toLowerCase().trim();
    for (const col of columns) {
      if (col.key.toLowerCase() === lower) return col.key;
      if (col.aliases.some((a) => a.toLowerCase() === lower)) return col.key;
    }
    return null;
  };

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array", cellDates: true });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        if (json.length === 0) {
          toast({ title: "File is empty", variant: "destructive" });
          return;
        }

        const parsed = json.map((raw) => {
          const mapped: Record<string, string> = {};
          for (const [rawKey, rawVal] of Object.entries(raw)) {
            const col = findColumn(rawKey);
            if (col) {
              mapped[col] = rawVal instanceof Date ? rawVal.toISOString() : String(rawVal ?? "");
            }
          }
          return mapped;
        });

        setRows(parsed);
        setStage("preview");
        toast({ title: `Loaded ${parsed.length} rows from ${file.name}` });
      } catch {
        toast({ title: "Failed to parse file", variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
  }, [columns]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const deleteRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    setSubmitting(true);
    const result = await onImport(rows);
    setSubmitting(false);
    if (result.success > 0) {
      toast({ title: `${result.success} records imported successfully` });
      setStage("done");
    }
    if (result.failed > 0) {
      toast({ title: `${result.failed} records failed to import`, variant: "destructive" });
    }
  };

  const handleReset = () => {
    setRows([]);
    setStage("upload");
    setFileName("");
  };

  if (stage === "done") {
    return (
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-3">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
          <p className="text-sm font-medium">Import complete</p>
          <Button variant="outline" size="sm" onClick={handleReset}>Import Another File</Button>
        </CardContent>
      </Card>
    );
  }

  if (stage === "upload") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/40 hover:bg-muted/50 transition-colors"
          >
            <Upload className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">Drag & drop an Excel file, or click to browse</p>
            <p className="text-xs text-muted-foreground">.xlsx, .xls, .csv</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>
          <div className="mt-3 p-2.5 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <span className="font-medium">Expected columns: </span>
            {columns.map((c) => c.label).join(", ")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-base">Preview Import</CardTitle>
            <p className="text-xs text-muted-foreground">{fileName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{rows.length} rows</Badge>
          <Button variant="ghost" size="sm" onClick={handleReset}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting || rows.length === 0}>
            <CheckCircle2 className="h-4 w-4 mr-1" />
            {submitting ? "Importing…" : "Import All"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-auto max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                {columns.map((c) => (
                  <TableHead key={c.key}>{c.label}</TableHead>
                ))}
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                  {columns.map((c) => (
                    <TableCell key={c.key} className="text-xs">
                      {row[c.key] || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteRow(i)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
