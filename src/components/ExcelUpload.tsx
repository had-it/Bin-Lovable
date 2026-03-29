import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

const EXPECTED_COLUMNS = [
  "BinID",
  "DrugID",
  "DisposalTime",
  "VolumeRemaining",
  "ExpiryDate",
] as const;

export interface ParsedWasteRow {
  id: string;
  binId: string;
  drugId: string;
  disposalTime: string;
  volumeRemaining: number;
  expiryDate: string;
  errors: string[];
}

type UploadStage = "upload" | "validate" | "submitted";

interface Props {
  onSubmit: (rows: ParsedWasteRow[]) => void;
  validBinIds: string[];
  validDrugIds: string[];
}

function validateRow(row: ParsedWasteRow, validBinIds: string[], validDrugIds: string[]): string[] {
  const errors: string[] = [];

  if (!row.binId || !validBinIds.includes(row.binId)) {
    errors.push("Unknown BinID");
  }

  if (!row.drugId || !validDrugIds.includes(row.drugId)) {
    errors.push("Unknown DrugID");
  }

  const dt = new Date(row.disposalTime);
  if (isNaN(dt.getTime())) errors.push("Invalid DisposalTime");

  if (isNaN(row.volumeRemaining) || row.volumeRemaining < 0) errors.push("Volume must be ≥ 0");

  const exp = new Date(row.expiryDate);
  if (isNaN(exp.getTime())) errors.push("Invalid ExpiryDate");

  return errors;
}

export function ExcelUpload({ onSubmit, validBinIds, validDrugIds }: Props) {
  const [stage, setStage] = useState<UploadStage>("upload");
  const [rows, setRows] = useState<ParsedWasteRow[]>([]);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        if (jsonData.length === 0) {
          toast.error("The file is empty");
          return;
        }

        const parsed: ParsedWasteRow[] = jsonData.map((raw, i) => {
          const disposalTimeRaw = raw.DisposalTime ?? raw.disposalTime ?? raw.disposal_time ?? raw.time ?? "";
          const expiryDateRaw = raw.ExpiryDate ?? raw.expiryDate ?? raw.expiry_date ?? "";

          const row: ParsedWasteRow = {
            id: `upload-${Date.now()}-${i}`,
            binId: String(raw.BinID ?? raw.binId ?? raw.binid ?? ""),
            drugId: String(raw.DrugID ?? raw.drugId ?? raw.drugid ?? ""),
            disposalTime: disposalTimeRaw instanceof Date
              ? disposalTimeRaw.toISOString().slice(0, 16)
              : String(disposalTimeRaw),
            volumeRemaining: Number(raw.VolumeRemaining ?? raw.volumeRemaining ?? raw.volume ?? 0),
            expiryDate: expiryDateRaw instanceof Date
              ? expiryDateRaw.toISOString().slice(0, 10)
              : String(expiryDateRaw),
            errors: [],
          };
          row.errors = validateRow(row, validBinIds, validDrugIds);
          return row;
        });

        setRows(parsed);
        setStage("validate");
        toast.success(`Loaded ${parsed.length} rows from ${file.name}`);
      } catch {
        toast.error("Failed to parse file. Please use a valid Excel or CSV file.");
      }
    };
    reader.readAsArrayBuffer(file);
  }, [validBinIds, validDrugIds]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const updateRow = (id: string, field: keyof Omit<ParsedWasteRow, "id" | "errors">, value: string | number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        updated.errors = validateRow(updated, validBinIds, validDrugIds);
        return updated;
      })
    );
  };

  const deleteRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const hasErrors = rows.some((r) => r.errors.length > 0);
  const errorCount = rows.filter((r) => r.errors.length > 0).length;

  const handleSubmit = () => {
    if (hasErrors) {
      toast.error("Fix all validation errors before submitting");
      return;
    }
    onSubmit(rows);
    setStage("submitted");
    toast.success(`${rows.length} waste events submitted`);
  };

  const handleReset = () => {
    setRows([]);
    setStage("upload");
    setFileName("");
    setEditingRow(null);
  };

  if (stage === "submitted") {
    return (
      <Card>
        <CardContent className="py-12 flex flex-col items-center gap-4">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">Data Submitted Successfully</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {rows.length} waste events have been validated and saved.
            </p>
          </div>
          <Button variant="outline" onClick={handleReset} className="mt-2">
            Upload New File
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (stage === "upload") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Waste Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-muted-foreground/25 rounded-2xl p-12 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/40 hover:bg-muted/50 transition-colors"
          >
            <Upload className="h-10 w-10 text-muted-foreground/50" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Drag & drop an Excel file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports .xlsx, .xls, .csv
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
          <div className="mt-4 p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground">
            <p className="font-medium mb-1">Expected columns:</p>
            <p>{EXPECTED_COLUMNS.join(", ")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Validate stage
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-base">Validate & Review</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{fileName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {rows.length} rows
          </Badge>
          {errorCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {errorCount} errors
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={hasErrors || rows.length === 0}>
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Validate & Submit
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border overflow-auto max-h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>BinID</TableHead>
                <TableHead>DrugID</TableHead>
                <TableHead>DisposalTime</TableHead>
                <TableHead>Volume (mL)</TableHead>
                <TableHead>ExpiryDate</TableHead>
                <TableHead className="w-20">Status</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => {
                const isEditing = editingRow === row.id;
                return (
                  <TableRow key={row.id} className={row.errors.length > 0 ? "bg-destructive/5" : ""}>
                    <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select value={row.binId} onValueChange={(v) => updateRow(row.id, "binId", v)}>
                          <SelectTrigger className="h-7 text-xs w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {validBinIds.map((id) => (
                              <SelectItem key={id} value={id}>{id}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-xs font-mono">{row.binId}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select value={row.drugId} onValueChange={(v) => updateRow(row.id, "drugId", v)}>
                          <SelectTrigger className="h-7 text-xs w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {validDrugIds.map((id) => (
                              <SelectItem key={id} value={id}>{id}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-xs font-mono">{row.drugId}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="datetime-local"
                          value={row.disposalTime}
                          onChange={(e) => updateRow(row.id, "disposalTime", e.target.value)}
                          className="h-7 text-xs w-44"
                        />
                      ) : (
                        <span className="text-xs">{row.disposalTime}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={row.volumeRemaining}
                          onChange={(e) => updateRow(row.id, "volumeRemaining", Number(e.target.value))}
                          className="h-7 text-xs w-20"
                        />
                      ) : (
                        <span className="text-xs">{row.volumeRemaining}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={row.expiryDate}
                          onChange={(e) => updateRow(row.id, "expiryDate", e.target.value)}
                          className="h-7 text-xs w-36"
                        />
                      ) : (
                        <span className="text-xs">{row.expiryDate}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.errors.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                          <span className="text-[10px] text-destructive">{row.errors[0]}</span>
                        </div>
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setEditingRow(isEditing ? null : row.id)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => deleteRow(row.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {hasErrors && (
          <p className="text-xs text-destructive mt-3 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            Fix all errors before submitting. Click the pencil icon to edit a row.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
