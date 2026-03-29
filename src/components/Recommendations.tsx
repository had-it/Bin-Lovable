import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { WasteEvent } from "@/data/seedData";

interface Recommendation {
  text: string;
  priority: "high" | "medium" | "low";
  details: string;
  actions: string[];
}

interface Props {
  events: WasteEvent[];
  showCost?: boolean;
}

export function Recommendations({ events, showCost = true }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const recommendations = useMemo(() => {
    if (events.length === 0) return [];

    const tips: Recommendation[] = [];

    // Analyse top disposal reason
    const reasonCounts: Record<string, number> = {};
    events.forEach((e) => {
      reasonCounts[e.reason] = (reasonCounts[e.reason] || 0) + 1;
    });
    const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0];
    if (topReason) {
      const pct = ((topReason[1] / events.length) * 100).toFixed(0);
      if (topReason[0] === "Expired") {
        tips.push({
          text: `${pct}% of waste is due to expiry. Consider reducing order quantities or implementing FEFO rotation.`,
          priority: "high",
          details: `Expired drugs account for ${topReason[1]} out of ${events.length} waste events. This is a systemic issue that can be addressed through better inventory management and shorter ordering cycles.`,
          actions: [
            "Implement First-Expiry-First-Out (FEFO) stock rotation",
            "Reduce standing order quantities for low-turnover drugs",
            "Set up automated expiry alerts 90, 60, and 30 days before expiry",
            "Review par levels monthly with pharmacy leads",
          ],
        });
      } else if (topReason[0] === "Preparation Surplus") {
        tips.push({
          text: `${pct}% of waste is preparation surplus. Review dose-rounding protocols to minimise leftover volumes.`,
          priority: "high",
          details: `Preparation surplus represents a significant opportunity for waste reduction. ${topReason[1]} events were caused by leftover drug after preparation, often due to fixed vial sizes not matching required doses.`,
          actions: [
            "Adopt dose-rounding or dose-banding protocols where clinically appropriate",
            "Evaluate availability of smaller vial sizes from suppliers",
            "Implement vial-sharing programmes for compatible preparations",
            "Train pharmacy staff on optimised reconstitution techniques",
          ],
        });
      } else {
        tips.push({
          text: `"${topReason[0]}" accounts for ${pct}% of events. Investigate root causes in affected departments.`,
          priority: "medium",
          details: `The disposal reason "${topReason[0]}" was recorded ${topReason[1]} times across the filtered period. Understanding the underlying drivers will help reduce future waste.`,
          actions: [
            "Conduct root-cause analysis sessions with department staff",
            "Review handling and storage procedures",
            "Implement corrective action plans for recurring issues",
          ],
        });
      }
    }

    // Top cost drug — only for roles with cost access
    if (showCost) {
      const drugCost: Record<string, number> = {};
      events.forEach((e) => {
        drugCost[e.drugName] = (drugCost[e.drugName] || 0) + e.costEur;
      });
      const topDrug = Object.entries(drugCost).sort((a, b) => b[1] - a[1])[0];
      if (topDrug) {
        tips.push({
          text: `${topDrug[0]} is the highest-cost waste item (€${topDrug[1].toFixed(0)}). Evaluate smaller vial sizes or multi-dose options.`,
          priority: "high",
          details: `€${topDrug[1].toFixed(0)} worth of ${topDrug[0]} was wasted during this period. High-cost drugs should be prioritised for waste reduction initiatives as they have the greatest financial impact.`,
          actions: [
            "Contact supplier about alternative vial sizes",
            "Assess feasibility of multi-dose vial protocols",
            "Schedule this drug for clinical pharmacist review",
            "Consider centralised preparation to reduce per-unit waste",
          ],
        });
      }

      // Department with most waste cost
      const deptCost: Record<string, number> = {};
      events.forEach((e) => {
        deptCost[e.department] = (deptCost[e.department] || 0) + e.costEur;
      });
      const topDept = Object.entries(deptCost).sort((a, b) => b[1] - a[1])[0];
      if (topDept) {
        tips.push({
          text: `${topDept[0]} has the highest waste cost. Schedule a review with department leads.`,
          priority: "medium",
          details: `The ${topDept[0]} department generated €${topDept[1].toFixed(0)} in pharmaceutical waste costs. Departmental reviews can identify specific workflow or ordering issues.`,
          actions: [
            "Schedule waste review meeting with department leads",
            "Compare waste rates against peer benchmarks",
            "Assign a pharmacy liaison for ongoing waste monitoring",
          ],
        });
      }

      // High cost outliers
      const avgCost = events.reduce((s, e) => s + e.costEur, 0) / events.length;
      const highCostCount = events.filter((e) => e.costEur > avgCost * 3).length;
      if (highCostCount > 0) {
        tips.push({
          text: `${highCostCount} events exceed 3× average cost. Set up automated alerts for high-value disposals.`,
          priority: "low",
          details: `${highCostCount} individual disposal events had costs more than 3 times the average (€${avgCost.toFixed(0)}). These outliers may indicate process failures or unusual clinical situations worth investigating.`,
          actions: [
            `Configure real-time alerts for disposals above €${(avgCost * 3).toFixed(0)}`,
            "Require supervisor sign-off for high-value disposals",
            "Audit flagged events monthly to identify patterns",
          ],
        });
      }
    } else {
      // Non-cost: volume-based department recommendation
      const deptVolume: Record<string, number> = {};
      events.forEach((e) => {
        deptVolume[e.department] = (deptVolume[e.department] || 0) + e.volumeMl;
      });
      const topDept = Object.entries(deptVolume).sort((a, b) => b[1] - a[1])[0];
      if (topDept) {
        tips.push({
          text: `${topDept[0]} has the highest waste volume (${(topDept[1] / 1000).toFixed(1)} L). Review disposal patterns.`,
          priority: "medium",
          details: `The ${topDept[0]} department generated ${(topDept[1] / 1000).toFixed(1)} L of pharmaceutical waste. Investigating disposal patterns can reveal improvement opportunities.`,
          actions: [
            "Review disposal logs with department staff",
            "Check for recurring waste sources",
            "Evaluate preparation workflows",
          ],
        });
      }

      // High volume outliers
      const avgVol = events.reduce((s, e) => s + e.volumeMl, 0) / events.length;
      const highVolCount = events.filter((e) => e.volumeMl > avgVol * 3).length;
      if (highVolCount > 0) {
        tips.push({
          text: `${highVolCount} events exceed 3× average volume. Investigate these outliers.`,
          priority: "low",
          details: `${highVolCount} disposal events had volumes more than 3 times the average (${avgVol.toFixed(0)} mL). These may indicate process issues.`,
          actions: [
            "Review flagged high-volume events",
            "Check preparation protocols for affected drugs",
          ],
        });
      }
    }

    return tips.slice(0, 4);
  }, [events, showCost]);

  if (recommendations.length === 0) return null;

  const priorityColors: Record<string, string> = {
    high: "bg-destructive/10 text-destructive",
    medium: "bg-chart-warning/10 text-chart-warning",
    low: "bg-primary/10 text-primary",
  };

  const priorityBorders: Record<string, string> = {
    high: "border-destructive/20",
    medium: "border-chart-warning/20",
    low: "border-primary/20",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <Lightbulb className="h-4 w-4 text-primary" />
        <CardTitle className="text-base">Recommendations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {recommendations.map((rec, i) => (
          <Collapsible
            key={i}
            open={openIndex === i}
            onOpenChange={(open) => setOpenIndex(open ? i : null)}
          >
            <CollapsibleTrigger asChild>
              <button
                className={`w-full rounded-xl px-3 py-2.5 text-xs leading-relaxed text-left transition-all cursor-pointer flex items-start gap-2 ${priorityColors[rec.priority] ?? "bg-muted text-muted-foreground"} hover:opacity-80`}
              >
                <span className="flex-1">{rec.text}</span>
                <ChevronDown className={`h-3.5 w-3.5 shrink-0 mt-0.5 transition-transform ${openIndex === i ? "rotate-180" : ""}`} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className={`mx-1 mt-1 mb-1 rounded-lg border ${priorityBorders[rec.priority] ?? "border-border"} bg-card px-3 py-3 space-y-2`}>
                <p className="text-xs text-muted-foreground leading-relaxed">{rec.details}</p>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Suggested Actions</p>
                  <ul className="space-y-1">
                    {rec.actions.map((action, j) => (
                      <li key={j} className="text-xs text-foreground flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
}
