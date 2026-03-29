import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Cell, Pie, PieChart } from "recharts";
import type { WasteEvent } from "@/data/seedData";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const chartConfig: ChartConfig = {
  count: { label: "Events" },
};

interface Props {
  events: WasteEvent[];
}

export function DisposalReasonsChart({ events }: Props) {
  const grouped: Record<string, number> = {};
  events.forEach((e) => {
    grouped[e.reason] = (grouped[e.reason] ?? 0) + 1;
  });

  const data = Object.entries(grouped).map(([reason, count]) => ({
    reason,
    count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Disposal Reasons</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="reason" />} />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              dataKey="count"
              nameKey="reason"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="flex flex-wrap gap-3 mt-2 justify-center">
          {data.map((d, i) => (
            <div key={d.reason} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              {d.reason} ({d.count})
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
