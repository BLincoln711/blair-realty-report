"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTopics } from "@/hooks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api";
import { TopicSummary } from "@/types";
import { SparklesIcon } from "lucide-react";

const topicSchema = z.object({
  topicName: z.string().min(3, "Topic name must be at least 3 characters."),
  entitySet: z.string().min(2, "Entity set is required."),
  querySeeds: z
    .string()
    .min(5, "Provide at least one seed (comma or newline separated)."),
});

type TopicFormValues = z.infer<typeof topicSchema>;

export default function TopicsPage() {
  const queryClient = useQueryClient();
  const topicsQuery = useTopics();
  const [isDialogOpen, setDialogOpen] = useState(false);

  const form = useForm<TopicFormValues>({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      topicName: "",
      entitySet: "",
      querySeeds: "",
    },
  });

  const createTopic = useMutation({
    mutationFn: async (values: TopicFormValues) => {
      const seeds = values.querySeeds
        .split(/[\n,]/)
        .map((seed) => seed.trim())
        .filter(Boolean);

      const payload: TopicSummary = {
        topicId:
          typeof crypto !== "undefined"
            ? crypto.randomUUID()
            : `topic-${Date.now()}`,
        topicName: values.topicName,
        activeQueries: seeds.length * 25,
        trackedEngines: 5,
        lastRunAt: new Date().toISOString(),
        querySeeds: seeds,
      };

      return api.createTopic(payload);
    },
    onSuccess: (newTopic) => {
      queryClient.setQueryData<TopicSummary[]>(["topics"], (current = []) => [
        newTopic,
        ...current,
      ]);
      setDialogOpen(false);
      form.reset();
    },
  });

  const topics = topicsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Topic manager
          </h1>
          <p className="text-sm text-muted-foreground">
            Define AI monitoring queues and generate query sets.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <SparklesIcon className="mr-2 h-4 w-4" />
              Generate queries
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>New topic</DialogTitle>
              <DialogDescription>
                We will send these seeds to the query generation agent running on
                Vertex AI.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                className="space-y-4"
                onSubmit={form.handleSubmit((values) => createTopic.mutate(values))}
              >
                <FormField
                  control={form.control}
                  name="topicName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic name</FormLabel>
                      <FormControl>
                        <Input placeholder="AI Overviews" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="entitySet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary brand / entity set</FormLabel>
                      <FormControl>
                        <Input placeholder="Hendricks.ai" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="querySeeds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Query seeds</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={5}
                          placeholder={`ai overview enterprise enablement\nbest ai onboarding platform`}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={createTopic.isPending}
                    className="w-full"
                  >
                    {createTopic.isPending ? "Generating..." : "Create topic"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Tracked topics</CardTitle>
            <p className="text-sm text-muted-foreground">
              Each topic generates 50–200 SERP queries per engine.
            </p>
          </div>
          <Badge variant="secondary">{topics.length} active</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[480px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic</TableHead>
                  <TableHead>Active queries</TableHead>
                  <TableHead>Engines</TableHead>
                  <TableHead>Seeds</TableHead>
                  <TableHead className="text-right">Last run</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topics.map((topic) => (
                  <TableRow key={topic.topicId}>
                    <TableCell className="font-medium">
                      {topic.topicName}
                    </TableCell>
                    <TableCell>{topic.activeQueries}</TableCell>
                    <TableCell>{topic.trackedEngines}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {topic.querySeeds?.map((seed) => (
                          <Badge key={seed} variant="outline">
                            {seed}
                          </Badge>
                        )) ?? (
                          <span className="text-sm text-muted-foreground">
                            No seeds on record
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {new Date(topic.lastRunAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {topics.map((topic) => (
          <Card key={`${topic.topicId}-details`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{topic.topicName}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {topic.activeQueries} queued · {topic.trackedEngines} engines
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs uppercase text-muted-foreground">
                Query seeds
              </p>
              <div className="flex flex-wrap gap-1.5">
                {topic.querySeeds?.map((seed) => (
                  <Badge key={seed} variant="secondary">
                    {seed}
                  </Badge>
                )) || (
                  <span className="text-sm text-muted-foreground">
                    Seeds will be generated soon.
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Next crawl</span>
                <span className="font-medium">
                  {new Intl.DateTimeFormat(undefined, {
                    weekday: "short",
                    hour: "numeric",
                  }).format(Date.now() + 1000 * 60 * 60 * 12)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
        {topics.length === 0 && (
          <Card>
            <CardContent className="flex h-40 flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <p>No topics defined yet.</p>
              <p>Use “Generate queries” to create your first queue.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

