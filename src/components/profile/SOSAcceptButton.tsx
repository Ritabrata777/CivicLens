"use client";

import { useTransition } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { acceptSOSAlertAction } from "@/server/actions";

export function SOSAcceptButton({ alertId }: { alertId: string }) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    return (
        <Button
            type="button"
            onClick={() => {
                startTransition(async () => {
                    const result = await acceptSOSAlertAction(alertId);
                    toast({
                        title: result.success ? "SOS accepted" : "Could not accept SOS",
                        description: result.message,
                        variant: result.success ? "default" : "destructive",
                    });

                    if (result.success) {
                        router.refresh();
                    }
                });
            }}
            disabled={isPending}
            className="gap-2"
        >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {isPending ? "Accepting..." : "Help On The Way"}
        </Button>
    );
}
