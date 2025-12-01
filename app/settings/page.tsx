"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Workspace settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure authentication, billing, and data retention defaults.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            This page will include controls for RBAC roles, Auth0 configuration, and
            Stripe powered billing locks. For now the navigation is wired so designers can
            validate layout flows.
          </p>
          <Badge variant="secondary">Spec placeholder</Badge>
        </CardContent>
      </Card>
    </div>
  );
}



