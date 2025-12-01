import { TopicSummary } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type TopicsPanelProps = {
  topics: TopicSummary[];
};

export function TopicsPanel({ topics }: TopicsPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Topic coverage</CardTitle>
        <p className="text-sm text-muted-foreground">
          Queued queries and recrawl status.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {topics.map((topic, index) => (
          <div key={topic.topicId} className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{topic.topicName}</p>
                <p className="text-xs text-muted-foreground">
                  {topic.activeQueries} active queries · {topic.trackedEngines} engines
                </p>
              </div>
              <Badge variant="secondary">
                Last run {new Date(topic.lastRunAt).toLocaleDateString()}
              </Badge>
            </div>
            {index !== topics.length - 1 && <Separator />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}



