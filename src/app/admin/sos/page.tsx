import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  ArrowRight,
  Clock3,
  MapPinned,
  Navigation,
  ShieldCheck,
  Siren,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildGoogleMapsUrl } from "@/lib/utils";
import { getSOSAlertsForAdmin, getUserById } from "@/server/data";

function statusTone(status: "Active" | "Accepted" | "Resolved") {
  if (status === "Accepted") {
    return "border-emerald-200 bg-emerald-100 text-emerald-800";
  }
  if (status === "Resolved") {
    return "border-slate-200 bg-slate-200 text-slate-700";
  }
  return "border-red-200 bg-red-100 text-red-800";
}

function emergencyTone(type: string) {
  const normalized = type.toLowerCase();

  if (normalized.includes("medical")) {
    return {
      shell: "border-rose-200/80 bg-gradient-to-br from-white via-rose-50/80 to-rose-100/80",
      chip: "bg-rose-100 text-rose-700 border-rose-200",
      accent: "bg-rose-500",
    };
  }

  if (normalized.includes("safety")) {
    return {
      shell: "border-amber-200/80 bg-gradient-to-br from-white via-amber-50/80 to-orange-100/80",
      chip: "bg-amber-100 text-amber-800 border-amber-200",
      accent: "bg-amber-500",
    };
  }

  return {
    shell: "border-sky-200/80 bg-gradient-to-br from-white via-sky-50/80 to-cyan-100/80",
    chip: "bg-sky-100 text-sky-800 border-sky-200",
    accent: "bg-sky-500",
  };
}

function buildDirectionsUrl(
  origin?: { lat?: number; lng?: number; label?: string },
  destination?: { lat?: number; lng?: number; label?: string }
) {
  if (
    typeof origin?.lat === "number" &&
    typeof origin?.lng === "number" &&
    typeof destination?.lat === "number" &&
    typeof destination?.lng === "number"
  ) {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`;
  }

  if (origin?.label && destination?.label) {
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin.label)}&destination=${encodeURIComponent(destination.label)}`;
  }

  return undefined;
}

export default async function AdminSOSPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token");

  if (!sessionToken?.value) {
    redirect("/admin/login");
  }

  const adminUser = await getUserById(sessionToken.value);
  if (!adminUser || adminUser.role !== "admin") {
    redirect("/admin/login");
  }

  const alerts = await getSOSAlertsForAdmin();
  const activeCount = alerts.filter((alert) => alert.status === "Active").length;
  const acceptedCount = alerts.filter((alert) => alert.status === "Accepted").length;
  const resolvedCount = alerts.filter((alert) => alert.status === "Resolved").length;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-red-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(248,113,113,0.18),_transparent_32%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(254,242,242,0.92)_42%,_rgba(255,247,237,0.95))] p-8 shadow-sm">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-300/20 blur-3xl" />
        <div className="absolute bottom-0 right-20 h-24 w-24 rounded-full bg-orange-200/20 blur-2xl" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white/80 px-3 py-1 text-sm font-medium text-red-700 backdrop-blur">
              <Siren className="h-4 w-4" />
              Admin SOS Tracking
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">Emergency command board</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Watch active incidents, see which Local Hero accepted each request, and jump straight into map routing without leaving the admin panel.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total Alerts</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">{alerts.length}</p>
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50/90 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-red-600">Waiting</p>
              <p className="mt-2 text-3xl font-bold text-red-700">{activeCount}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-600">Accepted</p>
              <p className="mt-2 text-3xl font-bold text-emerald-700">{acceptedCount}</p>
              <p className="mt-1 text-xs text-emerald-700/80">{resolvedCount} resolved</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-red-200/70 bg-red-50/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Alerts waiting for help</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">{activeCount}</div>
            <p className="mt-1 text-xs text-red-700/75">No helper accepted these yet.</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200/70 bg-emerald-50/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Helpers in transit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">{acceptedCount}</div>
            <p className="mt-1 text-xs text-emerald-700/75">Accepted and currently being handled.</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-slate-50/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Closed incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-700">{resolvedCount}</div>
            <p className="mt-1 text-xs text-slate-600">Resolved SOS cases recorded so far.</p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        {alerts.length === 0 ? (
          <Card className="rounded-[1.75rem] border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
              <Siren className="h-8 w-8 text-red-400" />
              <div>
                <p className="font-medium text-slate-900">No SOS alerts yet</p>
                <p className="mt-1 text-sm text-muted-foreground">When users raise emergency requests, they will appear here.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert) => {
            const tone = emergencyTone(alert.emergencyType);
            const senderMapUrl = buildGoogleMapsUrl({
              lat: alert.locationLat,
              lng: alert.locationLng,
              label: alert.locationAddress,
            });
            const helperMapUrl = buildGoogleMapsUrl({
              lat: alert.acceptedHelperLocationLat,
              lng: alert.acceptedHelperLocationLng,
              label: alert.acceptedHelperLocationAddress,
            });
            const directionsUrl = buildDirectionsUrl(
              {
                lat: alert.acceptedHelperLocationLat,
                lng: alert.acceptedHelperLocationLng,
                label: alert.acceptedHelperLocationAddress,
              },
              {
                lat: alert.locationLat,
                lng: alert.locationLng,
                label: alert.locationAddress,
              }
            );

            return (
              <Card key={alert.id} className={`overflow-hidden rounded-[1.75rem] border shadow-sm ${tone.shell}`}>
                <CardContent className="p-0">
                  <div className="flex items-stretch gap-0">
                    <div className={`hidden w-2 shrink-0 lg:block ${tone.accent}`} />

                    <div className="flex-1">
                      <div className="border-b border-black/5 px-5 py-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className={tone.chip}>
                                {alert.emergencyType}
                              </Badge>
                              <Badge variant="outline" className={statusTone(alert.status)}>
                                {alert.status}
                              </Badge>
                              <Badge variant="outline" className="border-white/80 bg-white/70 text-slate-700">
                                {alert.id}
                              </Badge>
                            </div>

                            <div>
                              <h2 className="text-xl font-semibold text-slate-950">
                                {alert.senderName || alert.senderId}
                                <span className="ml-2 text-sm font-normal text-slate-500">requested help</span>
                              </h2>
                              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                                <span className="inline-flex items-center gap-1.5">
                                  <Clock3 className="h-4 w-4" />
                                  {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  <MapPinned className="h-4 w-4" />
                                  Pincode {alert.pincode}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {senderMapUrl ? (
                              <Button asChild variant="outline" size="sm" className="rounded-full border-white/80 bg-white/80">
                                <Link href={senderMapUrl} target="_blank" rel="noreferrer">
                                  <MapPinned className="mr-2 h-4 w-4" />
                                  Sender Map
                                </Link>
                              </Button>
                            ) : null}
                            {directionsUrl ? (
                              <Button asChild size="sm" className="rounded-full bg-slate-950 text-white hover:bg-slate-800">
                                <Link href={directionsUrl} target="_blank" rel="noreferrer">
                                  <Navigation className="mr-2 h-4 w-4" />
                                  Open Route
                                </Link>
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 p-5 xl:grid-cols-[1fr_auto_1fr] xl:items-stretch">
                        <div className="rounded-[1.5rem] border border-white/80 bg-white/80 p-5 shadow-sm">
                          <div className="flex items-center gap-2 text-sm font-semibold text-rose-700">
                            <UserRound className="h-4 w-4" />
                            Sender
                          </div>
                          <p className="mt-3 text-lg font-semibold text-slate-950">{alert.senderName || alert.senderId}</p>
                          <p className="mt-3 text-sm leading-6 text-slate-600">{alert.locationAddress}</p>
                          {alert.details ? (
                            <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                              {alert.details}
                            </div>
                          ) : null}
                        </div>

                        <div className="hidden items-center justify-center xl:flex">
                          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white/80 shadow-sm">
                              <ArrowRight className="h-5 w-5" />
                            </div>
                            <span className="text-xs uppercase tracking-[0.2em]">Response</span>
                          </div>
                        </div>

                        <div className="rounded-[1.5rem] border border-white/80 bg-white/80 p-5 shadow-sm">
                          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                            <ShieldCheck className="h-4 w-4" />
                            Accepted Helper
                          </div>

                          {alert.acceptedByName || alert.acceptedById ? (
                            <>
                              <p className="mt-3 text-lg font-semibold text-slate-950">{alert.acceptedByName || alert.acceptedById}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                Accepted {alert.acceptedAt ? formatDistanceToNow(new Date(alert.acceptedAt), { addSuffix: true }) : "recently"}
                              </p>
                              <p className="mt-3 text-sm leading-6 text-slate-600">
                                {alert.acceptedHelperLocationAddress || "Helper location was not shared when the SOS was accepted."}
                              </p>

                              <div className="mt-4 flex flex-wrap gap-2">
                                {helperMapUrl ? (
                                  <Button asChild variant="outline" size="sm" className="rounded-full">
                                    <Link href={helperMapUrl} target="_blank" rel="noreferrer">
                                      <MapPinned className="mr-2 h-4 w-4" />
                                      Helper Map
                                    </Link>
                                  </Button>
                                ) : null}
                                {directionsUrl ? (
                                  <Button asChild variant="outline" size="sm" className="rounded-full">
                                    <Link href={directionsUrl} target="_blank" rel="noreferrer">
                                      <Activity className="mr-2 h-4 w-4" />
                                      Track Route
                                    </Link>
                                  </Button>
                                ) : null}
                              </div>
                            </>
                          ) : (
                            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                              No Local Hero has accepted this SOS yet.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </section>
    </div>
  );
}
