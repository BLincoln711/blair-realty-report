"use client";

import { useAlerts } from "@/hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangleIcon, BellRingIcon } from "lucide-react";

const settingsSchema = z.object({
  mentionDropThreshold: z.number().min(1).max(100),
  competitorSpikeThreshold: z.number().min(1).max(100),
  emailEnabled: z.boolean(),
  slackEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  slackWebhook: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function AlertsPage() {
  const alertsQuery = useAlerts();
  const alerts = alertsQuery.data ?? [];

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      mentionDropThreshold: 20,
      competitorSpikeThreshold: 25,
      emailEnabled: true,
      slackEnabled: true,
      smsEnabled: false,
      slackWebhook: "",
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Alerts center</h1>
          <p className="text-sm text-muted-foreground">
            Scheduler-triggered notifications for brand gains, losses, and topic spikes.
          </p>
        </div>
        <Button variant="outline">
          <AlertTriangleIcon className="mr-2 h-4 w-4" />
          Webhook reference
        </Button>
      </div>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Triggered alerts</CardTitle>
              <CardDescription>
                Generated every 2 hours for enterprise tier, daily for teams tier.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="text-right">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <Badge
                          variant={
                            alert.severity === "high"
                              ? "destructive"
                              : alert.severity === "medium"
                                ? "warning"
                                : "secondary"
                          }
                        >
                          {alert.type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{alert.message}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thresholds</CardTitle>
              <CardDescription>
                Configure detection rules for when we should raise an alert.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  className="grid gap-6 md:grid-cols-2"
                  onSubmit={form.handleSubmit((values) =>
                    console.log("Alert settings saved", values)
                  )}
                >
                  <FormField
                    control={form.control}
                    name="mentionDropThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lost citation (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="competitorSpikeThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Competitor surge (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emailEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2">
                        <FormLabel>Email alerts</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <CardDescription>
                          Send detailed summaries to the workspace distribution list.
                        </CardDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slackEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2">
                        <FormLabel>Slack alerts</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <Input
                          placeholder="https://hooks.slack.com/services/..."
                          value={form.watch("slackWebhook")}
                          onChange={(event) =>
                            form.setValue("slackWebhook", event.target.value)
                          }
                        />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="smsEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2">
                        <FormLabel>SMS alerts</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <CardDescription>
                          Limited to owner/admin roles. SMS only for high severity events.
                        </CardDescription>
                      </FormItem>
                    )}
                  />
                  <div className="md:col-span-2">
                    <Button type="submit" className="mt-2 w-full md:w-auto">
                      <BellRingIcon className="mr-2 h-4 w-4" />
                      Save alert rules
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

