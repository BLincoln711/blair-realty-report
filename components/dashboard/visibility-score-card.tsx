import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type VisibilityScoreCardProps = {
  score: number;
  percentile: number;
  change: number;
  benchmarks: { label: string; value: string }[];
};

export function VisibilityScoreCard({
  score,
  percentile,
  change,
  benchmarks,
}: VisibilityScoreCardProps) {
  const normalized = Math.min(Math.max(score, 0), 100);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">AI Visibility score</CardTitle>
          <p className="text-sm text-muted-foreground">
            Weighted coverage across engines
          </p>
        </div>
        <Badge variant="secondary" className="text-xs uppercase">
          {percentile}th percentile
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
          <svg className="h-full w-full">
            <circle
              stroke="hsl(var(--muted-foreground))"
              fill="transparent"
              strokeWidth="12"
              r={radius}
              cx="50%"
              cy="50%"
              opacity={0.2}
            />
            <circle
              stroke="hsl(var(--primary))"
              fill="transparent"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              r={radius}
              cx="50%"
              cy="50%"
              className="transition-all duration-500 ease-out"
            />
          </svg>
          <div className="absolute text-center">
            <p className="text-4xl font-semibold">{normalized.toFixed(1)}</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              score
            </p>
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Change vs. prior day
            </p>
            <p
              className={cn(
                "text-2xl font-semibold",
                change >= 0 ? "text-success-foreground" : "text-destructive"
              )}
            >
              {change >= 0 ? "+" : ""}
              {change.toFixed(1)} pts
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {benchmarks.map((item) => (
              <div key={item.label} className="rounded-lg border p-3">
                <p className="text-xs uppercase text-muted-foreground">
                  {item.label}
                </p>
                <p className="text-lg font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



