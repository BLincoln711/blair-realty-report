import { EngineBreakdown } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type EngineBreakdownCardProps = {
  data: EngineBreakdown[];
};

const engineLabels: Record<string, string> = {
  google_ai_overview: "Google AI Overview",
  gemini_ai_mode: "Gemini AI Mode",
  perplexity_answers: "Perplexity",
  chatgpt_search: "ChatGPT Search",
  bing_deep: "Bing Deep",
};

export function EngineBreakdownCard({ data }: EngineBreakdownCardProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Engine comparison</CardTitle>
        <p className="text-sm text-muted-foreground">
          Where your brand appears across AI answer surfaces.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((engine) => (
          <div key={engine.engine} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {engineLabels[engine.engine] ?? engine.engine}
              </span>
              <Badge
                variant={engine.change >= 0 ? "success" : "destructive"}
                className="capitalize"
              >
                {engine.change >= 0 ? "+" : ""}
                {(engine.change * 100).toFixed(1)}%
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full bg-primary transition-all",
                    engine.change < 0 && "bg-warning"
                  )}
                  style={{ width: `${Math.min(engine.share * 100, 100)}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground">
                {(engine.share * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {engine.totalMentions} mentions in last 24h
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}



