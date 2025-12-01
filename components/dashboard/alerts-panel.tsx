import { AlertRecord } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BellRingIcon } from "lucide-react";

type AlertsPanelProps = {
  alerts: AlertRecord[];
};

const severityMap: Record<AlertRecord["severity"], { label: string; variant: "warning" | "destructive" | "secondary" }> = {
  high: { label: "High", variant: "destructive" },
  medium: { label: "Medium", variant: "warning" },
  low: { label: "Low", variant: "secondary" },
};

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-base">Latest alerts</CardTitle>
          <p className="text-sm text-muted-foreground">
            Triggered by the scheduler in the last 24h.
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <BellRingIcon className="h-3.5 w-3.5" />
          Live
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => (
          <div key={alert.id} className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <Badge variant={severityMap[alert.severity].variant}>
                {severityMap[alert.severity].label}
              </Badge>
              <p className="text-xs text-muted-foreground">
                {new Date(alert.createdAt).toLocaleString()}
              </p>
            </div>
            <p className="mt-2 text-sm">{alert.message}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}



