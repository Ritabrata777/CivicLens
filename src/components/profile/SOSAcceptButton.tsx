"use client";

import { useTransition } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { acceptSOSAlertAction } from "@/server/actions";
import { buildGoogleMapsUrl } from "@/lib/utils";

export function SOSAcceptButton({ alertId }: { alertId: string }) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    return (
        <Button
            type="button"
            onClick={() => {
                startTransition(async () => {
                    let helperLocationAddress: string | undefined;
                    let helperLat: number | undefined;
                    let helperLng: number | undefined;

                    if (navigator.geolocation) {
                        try {
                            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                                navigator.geolocation.getCurrentPosition(resolve, reject, {
                                    enableHighAccuracy: true,
                                    timeout: 10000,
                                });
                            });

                            helperLat = position.coords.latitude;
                            helperLng = position.coords.longitude;
                            helperLocationAddress = `${helperLat.toFixed(6)}, ${helperLng.toFixed(6)}`;
                        } catch {
                            // If location permission is denied, the accept flow still succeeds.
                        }
                    }

                    const result = await acceptSOSAlertAction(alertId, {
                        helperLocationAddress,
                        helperLat,
                        helperLng,
                    });
                    toast({
                        title: result.success ? "SOS accepted" : "Could not accept SOS",
                        description: result.message,
                        variant: result.success ? "default" : "destructive",
                    });

                    if (result.success) {
                        const mapUrl = buildGoogleMapsUrl({
                            lat: result.alert?.locationLat,
                            lng: result.alert?.locationLng,
                            label: result.alert?.locationAddress,
                        });

                        if (mapUrl) {
                            window.open(mapUrl, "_blank", "noopener,noreferrer");
                        }

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
