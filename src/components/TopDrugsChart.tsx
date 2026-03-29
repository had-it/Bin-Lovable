import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import type { WasteEvent } from "@/data/seedData";

type Metric = "volume" | "cost";

interface Props {
  events: WasteEvent[];
}

export function TopDrugsChart({ events }: Props) {
  const [metric, setMetric] = useState<Metric>("cost");

  const chartConfig: ChartConfig = {
    value: { label: metric === "volume" ? "Volume (mL)" : "Cost (€)", color: "hsl(var(--chart-3))" },
  };

  const grouped: Record<string, { name: string; volume: number; cost: number }> = {};
  events.forEach((e) => {
    if (!grouped[e.drugId]) grouped[e.drugId] = { name: e.drugName, volume: 0, cost: 0 };
    grouped[e.drugId].volume += e.volumeMl;
    grouped[e.drugId].cost += e.costEur;
  });

  const data = Object.values(grouped)
    .sort((a, b) => (metric === "cost" ? b.cost - a.cost : b.volume - a.volume))
    .slice(0, 10)
    .map((d) => ({
      name: d.name.split(" ")[0],
      value: Math.round(metric === "cost" ? d.cost : d.volume),
    }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Top 10 Drugs</CardTitle>
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
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 60, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={55} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
