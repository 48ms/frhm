"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { BrandProfileEditorDialog } from "@/components/client/brand-profile-editor";

interface ClientSetupProps {
  clientId: string;
  stages: unknown[];
  skills: unknown[];
  clientSkills: unknown[];
  files: unknown[];
  provider: unknown;
  guardrails: unknown;
  groundTruths?: unknown[];
  channels?: unknown[];
}

export function ClientSetup({ clientId }: ClientSetupProps) {
  const [editorOpen, setEditorOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
        <div>
          <h3 className="font-semibold text-lg text-foreground">Brand Foundation & Setup</h3>
          <p className="text-sm text-muted-foreground">Kelola profile brand, tone of voice, dan foundation document client ini.</p>
        </div>
        <Button onClick={() => setEditorOpen(true)}>
          Edit Brand Profile
        </Button>
      </div>

      <BrandProfileEditorDialog
        clientId={clientId}
        open={editorOpen}
        onOpenChange={setEditorOpen}
      />
    </div>
  );
}
