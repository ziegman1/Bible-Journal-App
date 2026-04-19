"use client";

import { useState } from "react";
import { resetPracticeMetrics } from "@/app/actions/reset-practice-metrics";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function ResetPracticeMetricsSettings() {
  const [open, setOpen] = useState(false);

  async function handleConfirm() {
    const result = await resetPracticeMetrics();
    if ("error" in result) {
      toast.error(result.error);
      throw new Error(result.error);
    }
    toast.success("Practice metrics reset. Dashboards start fresh from today.");
  }

  return (
    <>
      <Card className="mt-8 border-amber-200/80 dark:border-amber-900/50">
        <CardHeader>
          <CardTitle className="text-lg">Reset practice metrics</CardTitle>
          <CardDescription>
            Treat today as day one for streaks, pace gauges, formation momentum, and related
            dashboards. Your journal, prayers, and other history stay in the app; only how metrics
            are counted changes going forward.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            Reset all metrics
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Reset all practice metrics?"
        description="From today onward, dashboards and streaks will ignore activity before this reset. This does not delete any of your entries or logs."
        confirmLabel="Reset metrics"
        variant="destructive"
        onConfirm={handleConfirm}
      />
    </>
  );
}
