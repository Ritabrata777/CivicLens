"use client";

import { formatDistanceToNow } from "date-fns";
import { BellRing, MapPin, ShieldAlert, Siren } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SOSAlert } from "@/lib/types";
import { SOSAcceptButton } from "@/components/profile/SOSAcceptButton";

type SOSDashboardProps = {
    helperAlerts: SOSAlert[];
    sentAlerts: SOSAlert[];
    currentUserId: string;
    defaultTab?: string;
};

function statusTone(status: SOSAlert["status"]) {
    if (status === "Accepted") {
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
    if (status === "Resolved") {
        return "border-slate-200 bg-slate-100 text-slate-700";
    }
    return "border-red-200 bg-red-50 text-red-700";
}

export function SOSDashboard({ helperAlerts, sentAlerts, currentUserId, defaultTab }: SOSDashboardProps) {
    return (
        <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Siren className="h-5 w-5 text-red-600" />
                    SOS Center
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue={defaultTab === "mine" ? "mine" : "helpers"} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="helpers" className="gap-2">
                            <BellRing className="h-4 w-4" />
                            Help Nearby
                        </TabsTrigger>
                        <TabsTrigger value="mine" className="gap-2">
                            <ShieldAlert className="h-4 w-4" />
                            My SOS
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="helpers" className="space-y-3">
                        {helperAlerts.length === 0 ? (
                            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                                No active SOS alerts are assigned to your area right now.
                            </div>
                        ) : (
                            helperAlerts.map((alert) => (
                                <div key={alert.id} className="rounded-2xl border bg-card p-4 shadow-sm">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold">{alert.emergencyType}</p>
                                                <Badge variant="outline" className={statusTone(alert.status)}>
                                                    {alert.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Sent {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                        {alert.status === "Active" ? (
                                            <SOSAcceptButton alertId={alert.id} />
                                        ) : alert.acceptedById === currentUserId ? (
                                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                                You accepted this SOS
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                                                Accepted by {alert.acceptedByName || "another hero"}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="mt-3 rounded-xl bg-muted/30 p-3 text-sm">
                                        <div className="flex items-center gap-2 font-medium">
                                            <MapPin className="h-4 w-4 text-primary" />
                                            {alert.locationAddress}
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">Pincode: {alert.pincode}</p>
                                        {typeof alert.distanceKm === "number" ? (
                                            <p className="mt-1 text-xs text-muted-foreground">Approx. {alert.distanceKm.toFixed(1)} km away</p>
                                        ) : null}
                                        {alert.details ? (
                                            <p className="mt-2 text-sm text-muted-foreground">{alert.details}</p>
                                        ) : null}
                                    </div>
                                </div>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="mine" className="space-y-3">
                        {sentAlerts.length === 0 ? (
                            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                                You have not sent any SOS alerts yet.
                            </div>
                        ) : (
                            sentAlerts.map((alert) => (
                                <div key={alert.id} className="rounded-2xl border bg-card p-4 shadow-sm">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold">{alert.emergencyType}</p>
                                                <Badge variant="outline" className={statusTone(alert.status)}>
                                                    {alert.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Sent {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                        <Badge variant="outline">
                                            {alert.notifiedHeroIds.length} hero{alert.notifiedHeroIds.length === 1 ? "" : "es"} alerted
                                        </Badge>
                                    </div>

                                    <div className="mt-3 rounded-xl bg-muted/30 p-3 text-sm">
                                        <div className="flex items-center gap-2 font-medium">
                                            <MapPin className="h-4 w-4 text-primary" />
                                            {alert.locationAddress}
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">Pincode: {alert.pincode}</p>
                                        {alert.acceptedByName ? (
                                            <p className="mt-2 text-sm text-emerald-700">
                                                {alert.acceptedByName} is on the way.
                                            </p>
                                        ) : (
                                            <p className="mt-2 text-sm text-muted-foreground">Waiting for a nearby Local Hero to accept.</p>
                                        )}
                                        {alert.details ? (
                                            <p className="mt-2 text-sm text-muted-foreground">{alert.details}</p>
                                        ) : null}
                                    </div>
                                </div>
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
