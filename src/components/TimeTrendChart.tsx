import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Area, AreaChart, Line, ComposedChart, XAxis, YAxis } from "recharts";
import { format, startOfWeek, startOfMonth, subMonths } from "date-fns";
import type { WasteEvent } from "@/data/seedData";

type Granularity = "daily" | "weekly" | "monthly";
type Metric = "volume" | "cost";

interface Props {
  events: WasteEvent[];
}

export function TimeTrendChart({ events }: Props) {
  const [granularity, setGranularity] = useState<Granularity>("weekly");
  const [metric, setMetric] = useState<Metric>("volume");

  const chartConfig: ChartConfig = {
    current: {
      label: metric === "volume" ? "Volume (mL)" : "Cost (€)",
      color: "#4361EE",
    },
    previous: {
      label: "Previous Period",
      color: "#D1D5DB",
    },
  };

  // Group current events
  const grouped: Record<string, { volume: number; cost: number }> = {};
  events.forEach((e) => {
    let key: string;
    if (granularity === "daily") key = format(e.date, "yyyy-MM-dd");
    else if (granularity === "weekly") key = format(startOfWeek(e.date, { weekStartsOn: 1 }), "yyyy-MM-dd");
    else key = format(startOfMonth(e.date), "yyyy-MM");
    if (!grouped[key]) grouped[key] = { volume: 0, cost: 0 };
    grouped[key].volume += e.volumeMl;
    grouped[key].cost += e.costEur;
  });

  const sortedEntries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

  // Create "previous period" as offset data for comparison line
  const data = sortedEntries.map(([date, vals], i) => {
    const currentVal = Math.round(metric === "volume" ? vals.volume : vals.cost);
    // Simulate previous period with offset from earlier data
    const prevIndex = Math.max(0, i - Math.floor(sortedEntries.length / 3));
    const prevEntry = sortedEntries[prevIndex];
    const prevVal = prevEntry
      ? Math.round(metric === "volume" ? prevEntry[1].volume * 0.85 : prevEntry[1].cost * 0.85)
      : 0;

    return {
      date,
      current: currentVal,
      previous: prevVal,
      label:
        granularity === "monthly"
          ? format(new Date(date + "-01"), "MMM yyyy")
          : format(new Date(date), "dd MMM"),
    };
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <div>
          <CardTitle className="text-base font-bold">Total Waste Trends</CardTitle>
          <p className="text-sm text-muted-foreground mt-0.5">Comparison across periods</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4361EE]" />
              <span>{metric === "volume" ? "Volume" : "Cost"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D1D5DB]" />
              <span>Previous</span>
            </div>
          </div>
          <div className="flex gap-1">
            {(["volume", "cost"] as Metric[]).map((m) => (
              <Button key={m} variant={metric === m ? "secondary" : "ghost"} size="sm" onClick={() => setMetric(m)} className="text-xs">
                {m === "volume" ? "mL" : "€"}
              </Button>
            ))}
          </div>
          <div className="flex gap-1">
            {(["daily", "weekly", "monthly"] as Granularity[]).map((g) => (
              <Button key={g} variant={granularity === g ? "default" : "outline"} size="sm" onClick={() => setGranularity(g)} className="text-xs capitalize">
                {g}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="trendGradientBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4361EE" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#4361EE" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {/* Dashed grey previous period line */}
            <Line
              type="monotone"
              dataKey="previous"
              stroke="#D1D5DB"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              activeDot={{ r: 5, fill: "#fff", stroke: "#D1D5DB", strokeWidth: 2 }}
            />
            {/* Solid blue current line with area fill */}
            <Area
              type="monotone"
              dataKey="current"
              stroke="#4361EE"
              strokeWidth={2.5}
              fill="url(#trendGradientBlue)"
              dot={false}
              activeDot={{ r: 5, fill: "#fff", stroke: "#4361EE", strokeWidth: 2 }}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
