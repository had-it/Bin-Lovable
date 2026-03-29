import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { DEPARTMENTS } from "@/data/seedData";
import type { WasteEvent } from "@/data/seedData";

const STACK_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface Props {
  events: WasteEvent[];
}

export function StackedCostChart({ events }: Props) {
  // Group cost by department (X) stacked by top drugs
  const drugTotals: Record<string, number> = {};
  events.forEach((e) => {
    drugTotals[e.drugName] = (drugTotals[e.drugName] ?? 0) + e.costEur;
  });
  const topDrugs = Object.entries(drugTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name]) => name);

  const grouped: Record<string, Record<string, number>> = {};
  DEPARTMENTS.forEach((dept) => {
    grouped[dept] = {};
    topDrugs.forEach((drug) => (grouped[dept][drug] = 0));
  });

  events.forEach((e) => {
    if (!grouped[e.department]) return;
    const drugKey = topDrugs.includes(e.drugName) ? e.drugName : null;
    if (drugKey) grouped[e.department][drugKey] += e.costEur;
  });

  const data = DEPARTMENTS.map((dept) => ({
    department: dept,
    ...Object.fromEntries(topDrugs.map((drug) => [drug, Math.round(grouped[dept]?.[drug] ?? 0)])),
  }));

  const chartConfig: ChartConfig = Object.fromEntries(
    topDrugs.map((drug, i) => [drug, { label: drug.split(" ")[0], color: STACK_COLORS[i] }])
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cost by Department & Drug (Top 5)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="department" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {topDrugs.map((drug, i) => (
              <Bar key={drug} dataKey={drug} stackId="stack" fill={STACK_COLORS[i]} radius={i === topDrugs.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ChartContainer>
        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          {topDrugs.map((drug, i) => (
            <div key={drug} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: STACK_COLORS[i] }} />
              {drug.split(" ")[0]}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
