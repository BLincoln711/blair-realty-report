"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEntities } from "@/hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { EntityRecord } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheckIcon } from "lucide-react";

const brandSchema = z.object({
  entityName: z.string().min(2, "Name is required."),
  domains: z.string().min(3, "Provide at least one domain."),
  synonyms: z.string().optional(),
});

type BrandFormValues = z.infer<typeof brandSchema>;

export default function BrandsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const entitiesQuery = useEntities();
  const queryClient = useQueryClient();

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      entityName: "",
      domains: "",
      synonyms: "",
    },
  });

  const createEntity = useMutation({
    mutationFn: async (values: BrandFormValues) => {
      const domains = values.domains
        .split(/[\n,]/)
        .map((domain) => domain.trim())
        .filter(Boolean);

      const synonyms = values.synonyms
        ?.split(/[\n,]/)
        .map((syn) => syn.trim())
        .filter(Boolean);

      const payload: EntityRecord = {
        entityId:
          typeof crypto !== "undefined"
            ? crypto.randomUUID()
            : `entity-${Date.now()}`,
        entityName: values.entityName,
        domains,
        synonyms: synonyms ?? [],
        status: "active",
      };

      return api.createEntity(payload);
    },
    onSuccess: (entity) => {
      queryClient.setQueryData<EntityRecord[]>(["entities"], (current = []) => [
        entity,
        ...current,
      ]);
      form.reset();
      setDialogOpen(false);
    },
  });

  const entities = entitiesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Brand manager
          </h1>
          <p className="text-sm text-muted-foreground">
            Map domains, synonyms, and status for normalized mentions.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <ShieldCheckIcon className="mr-2 h-4 w-4" />
              Add brand
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>New brand or entity</DialogTitle>
              <DialogDescription>
                Provide canonical domains and synonyms so the normalization engine
                can resolve mentions automatically.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                className="space-y-4"
                onSubmit={form.handleSubmit((values) => createEntity.mutate(values))}
              >
                <FormField
                  control={form.control}
                  name="entityName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand name</FormLabel>
                      <FormControl>
                        <Input placeholder="Hendricks.ai" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="domains"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domains</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder={`hendricks.ai\nhendricks.app`}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="synonyms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Synonyms</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Hendricks platform, HendricksAI"
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
                    className="w-full"
                    disabled={createEntity.isPending}
                  >
                    {createEntity.isPending ? "Saving..." : "Save entity"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entity inventory</CardTitle>
          <CardDescription>
            Toggle status to pause mentions from being included in reporting.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Domains</TableHead>
                <TableHead>Synonyms</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entities.map((entity) => (
                <TableRow key={entity.entityId}>
                  <TableCell className="font-medium">{entity.entityName}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {entity.domains.map((domain) => (
                        <Badge key={domain} variant="outline">
                          {domain}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {entity.synonyms.length ? (
                        entity.synonyms.map((syn) => (
                          <Badge key={syn} variant="secondary">
                            {syn}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          None provided
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Badge
                        variant={entity.status === "active" ? "success" : "secondary"}
                      >
                        {entity.status}
                      </Badge>
                      <Switch
                        checked={entity.status === "active"}
                        onCheckedChange={(checked) => {
                          queryClient.setQueryData<EntityRecord[]>(
                            ["entities"],
                            (current = []) =>
                              current.map((item) =>
                                item.entityId === entity.entityId
                                  ? { ...item, status: checked ? "active" : "paused" }
                                  : item
                              )
                          );
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {entities.map((entity) => (
          <Card key={`${entity.entityId}-card`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{entity.entityName}</CardTitle>
              <CardDescription>
                {entity.domains.length} canonical domains · {entity.synonyms.length} synonyms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Domains</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {entity.domains.map((domain) => (
                    <Badge key={domain} variant="outline">
                      {domain}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Synonyms</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {entity.synonyms.length ? (
                    entity.synonyms.map((syn) => (
                      <Badge key={syn} variant="secondary">
                        {syn}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">No synonyms recorded</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

