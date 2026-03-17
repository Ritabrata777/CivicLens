"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { resolveSOSAlertAction } from "@/server/actions";

export function ResolveSOSButton({ alertId }: { alertId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await resolveSOSAlertAction(alertId);

          toast({
            title: result.success ? "Incident closed" : "Could not close incident",
            description: result.message,
            variant: result.success ? "default" : "destructive",
          });

          if (result.success) {
            router.refresh();
          }
        });
      }}
      className="rounded-full border-emerald-200 bg-white/85 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/25 dark:!bg-emerald-500/12 dark:text-emerald-200 dark:hover:!bg-emerald-500/18"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
      {isPending ? "Closing..." : "Mark Resolved"}
    </Button>
  );
}
