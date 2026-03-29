import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { WasteEvent } from "@/data/seedData";

interface Props {
  events: WasteEvent[];
}

export function FlaggedEvents({ events }: Props) {
  const costs = events.map((e) => e.costEur).sort((a, b) => a - b);
  const p95 = costs[Math.floor(costs.length * 0.95)] ?? 0;
  const flagged = events
    .filter((e) => e.costEur >= p95)
    .sort((a, b) => b.costEur - a.costEur)
    .slice(0, 5);

  if (flagged.length === 0) return null;

  return (
    <Card className="border-destructive/20 h-full">
      <CardHeader className="flex flex-row items-center gap-2 py-3 px-4">
        <AlertTriangle className="h-3.5 w-3.5 text-destructive/70" />
        <CardTitle className="text-sm text-foreground">Flagged</CardTitle>
        <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0">{flagged.length}</Badge>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0">
        <TooltipProvider delayDuration={200}>
          <div className="flex flex-col gap-1.5">
            {flagged.map((e) => (
              <Tooltip key={e.id}>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-between rounded-lg bg-secondary px-2.5 py-1.5 text-xs cursor-default transition-colors hover:bg-primary/10">
                    <span className="font-medium text-foreground truncate mr-2">{e.drugName}</span>
                    <span className="text-chart-critical font-semibold whitespace-nowrap">€{e.costEur.toFixed(0)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs space-y-0.5 max-w-[200px]">
                  <p className="font-semibold">{e.drugName}</p>
                  <p className="text-muted-foreground">{e.department} · {e.hospitalName}</p>
                  <p className="text-muted-foreground">{e.reason} · {e.volumeMl.toFixed(0)} mL</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
