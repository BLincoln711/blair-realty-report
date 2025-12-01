import { CompetitorMetric } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

type CompetitorGridProps = {
  data: CompetitorMetric[];
};

export function CompetitorGrid({ data }: CompetitorGridProps) {
  return (
    <Card className="col-span-1 lg:col-span-1">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Competitor coverage</CardTitle>
        <p className="text-sm text-muted-foreground">
          Who owns the answer across tracked engines.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((competitor) => {
          const isUp = competitor.delta >= 0;
          const TrendIcon = isUp ? ArrowUpIcon : ArrowDownIcon;
          return (
            <div
              key={competitor.entityId}
              className="rounded-lg border p-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{competitor.entityName}</p>
                <Badge variant={isUp ? "success" : "warning"}>
                  {isUp ? "+" : ""}
                  {(competitor.delta * 100).toFixed(1)}%
                </Badge>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-semibold">
                    {(competitor.share * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {competitor.mentions} mentions
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">
                  <TrendIcon
                    className="h-3.5 w-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span>vs. last snapshot</span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}



