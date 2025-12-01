import { Citation } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type CitationTableProps = {
  data: Citation[];
};

const engineLabels: Record<string, string> = {
  google_ai_overview: "Google AI Overview",
  gemini_ai_mode: "Gemini AI Mode",
  perplexity_answers: "Perplexity",
  chatgpt_search: "ChatGPT Search",
  bing_deep: "Bing Deep",
};

export function CitationTable({ data }: CitationTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-base">Latest citations</CardTitle>
          <p className="text-sm text-muted-foreground">
            Normalized snapshots across all engines.
          </p>
        </div>
        <Badge variant="outline">{data.length} rows</Badge>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Engine</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Answer summary</TableHead>
                <TableHead className="text-right">Captured</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {engineLabels[row.engine] ?? row.engine}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{row.domain}</span>
                      <a
                        href={row.url}
                        className="text-xs text-primary underline-offset-4 hover:underline"
                      >
                        View source
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {row.brandName}
                      <Badge variant={row.mentionType === "explicit" ? "success" : "secondary"}>
                        {row.mentionType}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {row.answerText}
                    </p>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {new Date(row.capturedAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}



