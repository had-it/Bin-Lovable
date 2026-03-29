import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { WasteEvent } from "@/data/seedData";

type Metric = "volume" | "cost";

interface Props {
  events: WasteEvent[];
}

export function DepartmentChart({ events }: Props) {
  const [metric, setMetric] = useState<Metric>("volume");

  const chartConfig: ChartConfig = {
    value: { label: metric === "volume" ? "Volume (mL)" : "Cost (€)", color: "hsl(var(--chart-2))" },
  };

  const grouped: Record<string, { volume: number; cost: number }> = {};
  events.forEach((e) => {
    if (!grouped[e.department]) grouped[e.department] = { volume: 0, cost: 0 };
    grouped[e.department].volume += e.volumeMl;
    grouped[e.department].cost += e.costEur;
  });

  const data = Object.entries(grouped)
    .map(([department, vals]) => ({
      department,
      value: Math.round(metric === "volume" ? vals.volume : vals.cost),
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Waste by Department</CardTitle>
        <div className="flex gap-1">
          {(["volume", "cost"] as Metric[]).map((m) => (
            <Button key={m} variant={metric === m ? "secondary" : "ghost"} size="sm" onClick={() => setMetric(m)} className="text-xs">
              {m === "volume" ? "mL" : "€"}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="department" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
