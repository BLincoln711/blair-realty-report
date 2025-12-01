import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  sublabel?: string;
  trend?: number;
  trendLabel?: string;
  className?: string;
};

export function MetricCard({
  label,
  value,
  sublabel,
  trend,
  trendLabel,
  className,
}: MetricCardProps) {
  const TrendIcon = trend && trend < 0 ? ArrowDownIcon : ArrowUpIcon;
  const trendColor =
    trend && trend < 0 ? "text-destructive" : "text-success-foreground";

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        {sublabel && (
          <p className="text-sm text-muted-foreground">{sublabel}</p>
        )}
        {trend !== undefined && (
          <div className="flex items-center gap-1 text-sm">
            <TrendIcon
              className={cn("h-4 w-4", trendColor)}
              aria-hidden="true"
            />
            <span className={trendColor}>
              {trend > 0 ? "+" : ""}
              {trend.toFixed(1)}%
            </span>
            {trendLabel && (
              <span className="text-muted-foreground">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}



