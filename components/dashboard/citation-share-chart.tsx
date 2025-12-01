"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { CitationSharePoint } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend
);

type CitationShareChartProps = {
  data: CitationSharePoint[];
};

const colors = [
  "rgb(79, 70, 229)",
  "rgb(236, 72, 153)",
  "rgb(59, 130, 246)",
  "rgb(16, 185, 129)",
  "rgb(249, 115, 22)",
];

export function CitationShareChart({ data }: CitationShareChartProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, CitationSharePoint[]>();
    data.forEach((point) => {
      const bucket = map.get(point.entityId) ?? [];
      bucket.push(point);
      map.set(point.entityId, bucket);
    });
    return Array.from(map.entries());
  }, [data]);

  const chartData = useMemo(() => {
    const labels =
      grouped[0]?.[1].map((point) =>
        new Date(point.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })
      ) ?? [];
    const datasets = grouped.map(([entityId, points], index) => ({
      label: points[0]?.entityName ?? entityId,
      data: points.map((point) =>
        Number((point.citationShare * 100).toFixed(2))
      ),
      borderColor: colors[index % colors.length],
      backgroundColor: `${colors[index % colors.length]}20`,
      tension: 0.4,
      fill: true,
      pointRadius: 2.5,
    }));
    return { labels, datasets };
  }, [grouped]);

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base">Citation share trend</CardTitle>
          <p className="text-sm text-muted-foreground">
            Daily share of AI citations per competitor.
          </p>
        </div>
        <Badge variant="outline">Last 10 days</Badge>
      </CardHeader>
      <CardContent>
        <Line
          data={chartData}
          options={{
            responsive: true,
            interaction: {
              mode: "index" as const,
              intersect: false,
            },
            plugins: {
              legend: {
                display: true,
                position: "bottom",
              },
            },
            scales: {
              y: {
                grace: "10%",
                ticks: {
                  callback: (value) => `${value}%`,
                },
                grid: {
                  color: "rgba(148, 163, 184, 0.2)",
                },
              },
              x: {
                grid: {
                  display: false,
                },
              },
            },
          }}
        />
      </CardContent>
    </Card>
  );
}



