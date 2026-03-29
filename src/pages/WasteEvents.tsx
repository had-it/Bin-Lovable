import { useState, useCallback, useEffect } from "react";
import { TopNav } from "@/components/TopNav";
import { ExcelUpload, type ParsedWasteRow } from "@/components/ExcelUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Lock, Loader2, MessageSquare, Flag, CheckCircle2, AlertTriangle, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const HOSPITAL_TABLES = [
  { id: "karolinska", label: "Karolinska University Hospital", wasteTable: "karolinska_university_hospital_waste" as const, wasteView: "karolinska_university_hospital_waste_view", binsTable: "karolinska_university_hospital_bins" as const, binsView: "karolinska_university_hospital_bins_view" },
  { id: "capio", label: "Capio St Görans Sjukhus", wasteTable: "capio_st_görans_sjukhus_waste" as const, wasteView: "capio_st_görans_sjukhus_waste_view", binsTable: "capio_st_görans_sjukhus_bins" as const, binsView: "capio_st_görans_sjukhus_bins_view" },
];

const FLAG_OPTIONS = [
  { value: "", label: "No flag" },
  { value: "suspected_error", label: "Suspected Error" },
  { value: "unusual_volume", label: "Unusual Volume" },
  { value: "needs_investigation", label: "Needs Investigation" },
];

interface SubmittedRow {
  wasteid: string;
  binid: string;
  drugid: string;
  time: string;
  volume: number;
  expiry_date: string;
}

interface Annotation {
  id?: string;
  wasteid: string;
  hospital_id: string;
  note: string | null;
  flag: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

const WasteEventsPage = () => {
  const { user } = useAuth();
  const { activeRole, impersonatedUser } = useRole();
  const isBinSightAdmin = activeRole === "BinSight Admin";
  const userHospitalId = impersonatedUser?.hospital ?? user?.hospital ?? null;
  const defaultHospital = (!isBinSightAdmin && userHospitalId) ? userHospitalId : HOSPITAL_TABLES[0].id;
  const [selectedHospital, setSelectedHospital] = useState(defaultHospital);
  const effectiveHospital = isBinSightAdmin ? selectedHospital : (userHospitalId ?? selectedHospital);
  const [validBinIds, setValidBinIds] = useState<string[]>([]);
  const [validDrugIds, setValidDrugIds] = useState<string[]>([]);
  const [submittedEvents, setSubmittedEvents] = useState<SubmittedRow[]>([]);
  const [annotations, setAnnotations] = useState<Map<string, Annotation>>(new Map());
  const [loading, setLoading] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeWasteId, setActiveWasteId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");
  const [editFlag, setEditFlag] = useState("");
  const [saving, setSaving] = useState(false);

  const hospitalConfig = HOSPITAL_TABLES.find((h) => h.id === effectiveHospital)!;

  // Load valid IDs from Supabase
  useEffect(() => {
    async function loadLookups() {
      const { data: bins } = await supabase.from(hospitalConfig.binsView as any).select("binid");
      const { data: drugs } = await supabase.from("drugs_view" as any).select("drugid");
      setValidBinIds((bins as unknown as { binid: string }[])?.map((b) => b.binid) ?? []);
      setValidDrugIds((drugs as unknown as { drugid: string }[])?.map((d) => d.drugid) ?? []);
    }
    loadLookups();
  }, [hospitalConfig.binsTable]);

  // Load existing waste events
  useEffect(() => {
    async function loadEvents() {
      const { data } = await supabase
        .from(hospitalConfig.wasteView as any)
        .select("wasteid, binid, drugid, time, volume, expiry_date")
        .order("time", { ascending: false })
        .limit(100);
      const rows = (data as unknown as Array<{
        wasteid: string; binid: string | null; drugid: string | null;
        time: string | null; volume: number | null; expiry_date: string | null;
      }>) ?? [];
      setSubmittedEvents(
        rows.map((d) => ({
          wasteid: d.wasteid,
          binid: d.binid ?? "",
          drugid: d.drugid ?? "",
          time: d.time ?? "",
          volume: d.volume ?? 0,
          expiry_date: d.expiry_date ?? "",
        }))
      );
    }
    loadEvents();
  }, [hospitalConfig.wasteTable]);

  // Load annotations for current hospital
  useEffect(() => {
    async function loadAnnotations() {
      const { data } = await supabase
        .from("waste_event_annotations" as any)
        .select("*")
        .eq("hospital_id", effectiveHospital);
      const map = new Map<string, Annotation>();
      ((data ?? []) as unknown as Annotation[]).forEach((a) => {
        map.set(a.wasteid, a);
      });
      setAnnotations(map);
    }
    loadAnnotations();
  }, [effectiveHospital]);

  const handleUploadSubmit = useCallback(
    async (rows: ParsedWasteRow[]) => {
      setLoading(true);
      const inserts = rows.map((r, i) => ({
        wasteid: `W-${Date.now()}-${i}`,
        binid: r.binId,
        drugid: r.drugId,
        time: new Date(r.disposalTime).toISOString(),
        volume: r.volumeRemaining,
        expiry_date: new Date(r.expiryDate).toISOString(),
      }));

      const { error } = await supabase.from(hospitalConfig.wasteTable).insert(inserts);
      setLoading(false);

      if (error) {
        toast.error(`Insert failed: ${error.message}`);
        return;
      }

      setSubmittedEvents((prev) => [...inserts.map((ins) => ({
        wasteid: ins.wasteid,
        binid: ins.binid,
        drugid: ins.drugid,
        time: ins.time,
        volume: ins.volume,
        expiry_date: ins.expiry_date,
      })), ...prev]);
    },
    [hospitalConfig.wasteTable]
  );

  const openAnnotationDialog = (wasteid: string) => {
    const existing = annotations.get(wasteid);
    setActiveWasteId(wasteid);
    setEditNote(existing?.note ?? "");
    setEditFlag(existing?.flag ?? "");
    setDialogOpen(true);
  };

  const handleSaveAnnotation = async () => {
    if (!activeWasteId) return;
    setSaving(true);

    const flagValue = editFlag === "none" ? null : editFlag || null;
    const payload = {
      wasteid: activeWasteId,
      hospital_id: effectiveHospital,
      note: editNote || null,
      flag: flagValue,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("waste_event_annotations" as any)
      .upsert(payload as any, { onConflict: "wasteid,hospital_id" });

    setSaving(false);
    if (error) {
      toast.error(`Save failed: ${error.message}`);
      return;
    }

    setAnnotations((prev) => {
      const next = new Map(prev);
      next.set(activeWasteId, { ...prev.get(activeWasteId), ...payload } as Annotation);
      return next;
    });
    setDialogOpen(false);
    toast.success("Annotation saved");
  };

  const handleMarkReviewed = async (wasteid: string) => {
    const now = new Date().toISOString();
    const reviewerName = user?.name ?? user?.email ?? "Unknown";

    const payload = {
      wasteid,
      hospital_id: effectiveHospital,
      reviewed_by: reviewerName,
      reviewed_at: now,
      updated_at: now,
    };

    const { error } = await supabase
      .from("waste_event_annotations" as any)
      .upsert(payload as any, { onConflict: "wasteid,hospital_id" });

    if (error) {
      toast.error(`Review failed: ${error.message}`);
      return;
    }

    setAnnotations((prev) => {
      const next = new Map(prev);
      const existing = prev.get(wasteid);
      next.set(wasteid, { ...existing, ...payload } as Annotation);
      return next;
    });
    toast.success("Marked as reviewed");
  };

  const getFlagLabel = (value: string | null) =>
    FLAG_OPTIONS.find((f) => f.value === value)?.label ?? value ?? "";

  return (
    <div className="min-h-screen flex flex-col w-full bg-muted/30">
      <TopNav />
      <main className="flex-1 p-8 space-y-8 overflow-auto max-w-[1400px] mx-auto w-full">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Waste Events</h1>
            <p className="text-sm text-muted-foreground mt-1">Upload and validate pharmaceutical waste data. Events cannot be edited or deleted.</p>
          </div>
          {isBinSightAdmin ? (
            <Select value={selectedHospital} onValueChange={setSelectedHospital}>
              <SelectTrigger className="w-[280px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOSPITAL_TABLES.map((h) => (
                  <SelectItem key={h.id} value={h.id}>{h.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center gap-2 px-3 h-10 rounded-md border border-input bg-card text-sm text-foreground">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>{hospitalConfig.label}</span>
            </div>
          )}
        </div>

        <ExcelUpload
          onSubmit={handleUploadSubmit}
          validBinIds={validBinIds}
          validDrugIds={validDrugIds}
        />

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving to database…
          </div>
        )}

        {submittedEvents.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Submitted Events</CardTitle>
              </div>
              <Badge variant="secondary" className="text-xs">
                {submittedEvents.length} events
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border overflow-auto max-h-[500px]">
                <TooltipProvider delayDuration={200}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>WasteID</TableHead>
                        <TableHead>BinID</TableHead>
                        <TableHead>DrugID</TableHead>
                        <TableHead>DisposalTime</TableHead>
                        <TableHead className="text-right">Volume (mL)</TableHead>
                        <TableHead>ExpiryDate</TableHead>
                        <TableHead className="text-center">Flag</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead>Reviewed</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submittedEvents.map((event, i) => {
                        const ann = annotations.get(event.wasteid);
                        const isReviewed = !!ann?.reviewed_by;
                        return (
                          <TableRow key={event.wasteid}>
                            <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                            <TableCell className="text-xs font-mono">{event.wasteid}</TableCell>
                            <TableCell className="text-xs font-mono">{event.binid}</TableCell>
                            <TableCell className="text-xs font-mono">{event.drugid}</TableCell>
                            <TableCell className="text-xs">{event.time ? new Date(event.time).toLocaleString() : "—"}</TableCell>
                            <TableCell className="text-xs text-right">{event.volume}</TableCell>
                            <TableCell className="text-xs">{event.expiry_date ? new Date(event.expiry_date).toLocaleDateString() : "—"}</TableCell>
                            <TableCell className="text-center">
                              {ann?.flag ? (
                                <Badge variant="destructive" className="text-[10px] gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  {getFlagLabel(ann.flag)}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs max-w-[150px]">
                              {ann?.note ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="truncate block cursor-default">{ann.note}</span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-[300px] text-xs whitespace-pre-wrap">
                                    {ann.note}
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs">
                              {isReviewed ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 text-primary cursor-default">
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      <span className="font-medium">{ann!.reviewed_by}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">
                                    Reviewed {ann!.reviewed_at ? new Date(ann!.reviewed_at).toLocaleString() : ""}
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => openAnnotationDialog(event.wasteid)}
                                    >
                                      <MessageSquare className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Add note / flag</TooltipContent>
                                </Tooltip>
                                {!isReviewed && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => handleMarkReviewed(event.wasteid)}
                                      >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Mark as reviewed</TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Annotation Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">Annotate Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Flag</label>
                <Select value={editFlag} onValueChange={setEditFlag}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a flag…" />
                  </SelectTrigger>
                  <SelectContent>
                    {FLAG_OPTIONS.map((f) => (
                      <SelectItem key={f.value} value={f.value || "none"}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Note</label>
                <Textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Add a note about this event…"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveAnnotation} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default WasteEventsPage;
