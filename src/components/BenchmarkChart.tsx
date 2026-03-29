import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";
import { format, startOfMonth, subMonths } from "date-fns";
import type { WasteEvent } from "@/data/seedData";

const chartConfig: ChartConfig = {
  current: { label: "Current Period", color: "hsl(var(--chart-1))" },
  previous: { label: "Previous Period", color: "hsl(var(--chart-5))" },
};

interface Props {
  events: WasteEvent[];
}

export function BenchmarkChart({ events }: Props) {
  // Split events into current 3 months vs previous 3 months
  const now = new Date(2026, 1, 1);
  const midpoint = subMonths(now, 3);

  const groupByMonth = (evts: WasteEvent[]) => {
    const g: Record<string, number> = {};
    evts.forEach((e) => {
      const key = format(startOfMonth(e.date), "MMM");
      g[key] = (g[key] ?? 0) + e.costEur;
    });
    return g;
  };

  const currentEvents = events.filter((e) => e.date >= midpoint);
  const previousEvents = events.filter((e) => e.date < midpoint);

  const currentGrouped = groupByMonth(currentEvents);
  const previousGrouped = groupByMonth(previousEvents);

  const allMonths = [...new Set([...Object.keys(previousGrouped), ...Object.keys(currentGrouped)])];

  const data = allMonths.map((month) => ({
    month,
    previous: Math.round(previousGrouped[month] ?? 0),
    current: Math.round(currentGrouped[month] ?? 0),
  }));

  const currentTotal = currentEvents.reduce((s, e) => s + e.costEur, 0);
  const previousTotal = previousEvents.reduce((s, e) => s + e.costEur, 0);
  const change = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Period Comparison (Cost €)</CardTitle>
        <span className={`text-sm font-semibold ${change <= 0 ? "text-emerald-600" : "text-destructive"}`}>
          {change > 0 ? "+" : ""}{change.toFixed(1)}%
        </span>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar dataKey="previous" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="current" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
