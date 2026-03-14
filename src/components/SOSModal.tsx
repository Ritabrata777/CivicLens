"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, HeartPulse, Loader2, ShieldAlert, Siren, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createSOSQuickAlertAction } from "@/server/actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const SOS_BUTTONS = [
    {
        label: "Medical",
        value: "Medical Emergency",
        icon: HeartPulse,
        className: "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-400",
        ringClassName: "bg-rose-500/15 text-rose-600",
    },
    {
        label: "Safety",
        value: "Safety Emergency",
        icon: ShieldAlert,
        className: "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:border-amber-400",
        ringClassName: "bg-amber-500/15 text-amber-600",
    },
    {
        label: "Other",
        value: "Other Emergency",
        icon: TriangleAlert,
        className: "border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-400",
        ringClassName: "bg-sky-500/15 text-sky-600",
    },
];

export function SOSModal({ isLoggedIn }: { isLoggedIn?: boolean }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [activeType, setActiveType] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            setActiveType(null);
        }
    }, [open]);

    const handleSOS = (emergencyType: string) => {
        if (!isLoggedIn) {
            toast({
                title: "Login required",
                description: "Please log in before sending an SOS alert.",
                variant: "destructive",
            });
            return;
        }

        startTransition(async () => {
            setActiveType(emergencyType);

            if (!navigator.geolocation) {
                toast({
                    title: "Location unavailable",
                    description: "Your browser does not support geolocation.",
                    variant: "destructive",
                });
                setActiveType(null);
                return;
            }

            navigator.geolocation.getCurrentPosition(async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                try {
                    let locationAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    let pincode = "";
                    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;

                    if (apiKey) {
                        const response = await fetch(`https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${apiKey}`);
                        if (response.ok) {
                            const data = await response.json();
                            const firstFeature = data.features?.[0];
                            const address = firstFeature?.place_name;
                            const postcodeContext = firstFeature?.context?.find((item: any) => `${item.id || ""}`.includes("postcode"))?.text;
                            const postcode = postcodeContext || firstFeature?.properties?.postcode;

                            if (address) {
                                locationAddress = address;
                            }
                            if (postcode) {
                                pincode = String(postcode).replace(/\D/g, "").slice(0, 6);
                            }
                        }
                    }

                    if (!pincode) {
                        const match = locationAddress.match(/(\d{3})[\s-]?(\d{3})/);
                        pincode = match ? `${match[1]}${match[2]}` : "";
                    }

                    if (!pincode) {
                        toast({
                            title: "Pincode not found",
                            description: "We could not detect your pincode automatically. Please try again where location access is clearer.",
                            variant: "destructive",
                        });
                        setActiveType(null);
                        return;
                    }

                    const result = await createSOSQuickAlertAction({
                        emergencyType,
                        locationAddress,
                        pincode,
                        lat,
                        lng,
                    });

                    toast({
                        title: result.success ? "SOS sent" : "SOS failed",
                        description: result.message,
                        variant: result.success ? "default" : "destructive",
                    });

                    if (result.success) {
                        setOpen(false);
                    }
                } catch {
                    toast({
                        title: "SOS failed",
                        description: "We could not send your SOS alert right now.",
                        variant: "destructive",
                    });
                } finally {
                    setActiveType(null);
                }
            }, () => {
                toast({
                    title: "Location unavailable",
                    description: "We could not detect your location automatically.",
                    variant: "destructive",
                });
                setActiveType(null);
            });
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="lg" variant="destructive" className="h-12 gap-2 px-8 shadow-lg shadow-red-500/25">
                    <Siren className="h-5 w-5" />
                    SOS Emergency
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl text-red-700">SOS</DialogTitle>
                </DialogHeader>

                {!isLoggedIn ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                            <p>Please log in first to send an SOS alert.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {SOS_BUTTONS.map((item) => {
                            const Icon = item.icon;
                            const isLoading = isPending && activeType === item.value;

                            return (
                                <Button
                                    key={item.value}
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleSOS(item.value)}
                                    disabled={isPending}
                                    className={cn(
                                        "group h-auto min-h-40 flex-col items-center justify-center gap-4 rounded-[2rem] border-2 px-4 py-6 text-center text-base font-semibold shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
                                        item.className
                                    )}
                                >
                                    <div className={cn(
                                        "flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105",
                                        item.ringClassName
                                    )}>
                                        {isLoading ? <Loader2 className="h-7 w-7 animate-spin" /> : <Icon className="h-7 w-7" />}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-lg font-bold">{item.label}</div>
                                        <div className="text-xs font-medium opacity-75">Tap to alert nearby helpers</div>
                                    </div>
                                </Button>
                            );
                        })}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
