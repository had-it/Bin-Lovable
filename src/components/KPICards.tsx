import { Card, CardContent } from "@/components/ui/card";
import { Beaker, Euro, Hash, Pill } from "lucide-react";
import type { WasteEvent } from "@/data/seedData";

interface KPICardsProps {
  events: WasteEvent[];
  showCost?: boolean;
}

export function KPICards({ events, showCost = true }: KPICardsProps) {
  const totalVolume = events.reduce((sum, e) => sum + e.volumeMl, 0);
  const totalCost = events.reduce((sum, e) => sum + e.costEur, 0);
  const eventCount = events.length;

  const drugVolumes: Record<string, { name: string; volume: number }> = {};
  events.forEach((e) => {
    if (!drugVolumes[e.drugId]) drugVolumes[e.drugId] = { name: e.drugName, volume: 0 };
    drugVolumes[e.drugId].volume += e.volumeMl;
  });
  const topDrug = Object.values(drugVolumes).sort((a, b) => b.volume - a.volume)[0];

  const cards = [
    {
      title: "Total Wasted Volume",
      value: `${(totalVolume / 1000).toFixed(1)} L`,
      icon: Beaker,
      subtitle: `${totalVolume.toFixed(0)} mL`,
      color: "text-primary",
      bgColor: "bg-primary/10",
      show: true,
    },
    {
      title: "Total Estimated Cost",
      value: `€${totalCost.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: Euro,
      subtitle: `Across ${eventCount} events`,
      color: "text-chart-critical",
      bgColor: "bg-chart-critical/10",
      show: showCost,
    },
    {
      title: "Waste Events",
      value: eventCount.toLocaleString(),
      icon: Hash,
      subtitle: "Total recorded events",
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
      show: true,
    },
    {
      title: "Most Wasted Drug",
      value: topDrug?.name.split(" ")[0] ?? "—",
      icon: Pill,
      subtitle: topDrug ? `${(topDrug.volume / 1000).toFixed(1)} L wasted` : "",
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      show: true,
    },
  ];

  const visibleCards = cards.filter((c) => c.show);

  const gridClass = visibleCards.length === 3
    ? "grid grid-cols-1 sm:grid-cols-3 gap-6"
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6";

  return (
    <div className={gridClass}>
      {visibleCards.map((card) => (
        <Card key={card.title} className="border border-border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
              <div className={`h-10 w-10 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground tracking-tight">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
