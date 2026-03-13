"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { detectDuplicatesAction } from "@/ai/actions";
import { Loader2, Copy, AlertTriangle, Check, ExternalLink, MapPin } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface DuplicateMatch {
    id: string;
    title: string;
    score: number;
    image_score: number;
    text_score: number;
    image_url: string;
    category?: string;
    location_address?: string;
    postal_code?: string;
    shared_utilities?: string[];
}

export function DuplicateChecker({ issueId }: { issueId: string }) {
    const [isPending, startTransition] = useTransition();
    const [matches, setMatches] = useState<DuplicateMatch[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const runCheck = () => {
        setError(null);
        startTransition(async () => {
            const result = await detectDuplicatesAction(issueId);
            if (result.error) {
                setError(result.error);
                setMatches(null);
            } else {
                setMatches(result.matches);
            }
        });
    };

    if (matches === null && !isPending && !error) {
        return (
            <Button onClick={runCheck} variant="outline" className="w-full gap-2 border-dashed border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100">
                <Copy className="w-4 h-4" /> Run AI Duplicate Check
            </Button>
        );
    }

    return (
        <Card className="border-amber-300 bg-gradient-to-br from-amber-50 via-white to-rose-50 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2 text-amber-950">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-amber-700">
                            <AlertTriangle className="w-4 h-4" />
                        </span>
                        Duplicate Detection
                    </span>
                    {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                    ) : (
                        <Button size="sm" variant="ghost" onClick={runCheck} className="h-7 rounded-full px-3 text-xs text-amber-800 hover:bg-amber-100 hover:text-amber-950">
                            Re-run
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="mb-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        Error: {error}
                    </div>
                )}

                {matches && matches.length === 0 && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                        <Check className="w-4 h-4" /> No duplicates detected. (0 matches found)
                    </div>
                )}

                {matches && matches.length > 0 && (
                    <div className="space-y-4">
                        <p className="text-sm font-medium text-amber-900">Found {matches.length} potential duplicate(s):</p>
                        {matches.map((match) => (
                            <div key={match.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="font-medium text-slate-950">
                                        <Link href={`/admin/issues/${match.id}`} className="flex items-center gap-1 hover:text-amber-700 hover:underline">
                                            {match.title || "Untitled Issue"}
                                            <ExternalLink className="w-3 h-3" />
                                        </Link>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={match.score > 80
                                            ? "border-red-200 bg-red-50 text-red-700"
                                            : "border-amber-200 bg-amber-50 text-amber-800"}
                                    >
                                        {match.score}% Match
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
                                    <div className="space-y-1 rounded-xl bg-slate-50 p-3">
                                        <div className="flex justify-between font-medium">
                                            <span>Text Similarity</span>
                                            <span className="text-slate-900">{match.text_score}%</span>
                                        </div>
                                        <Progress value={match.text_score} className="h-2 bg-slate-200 [&>div]:bg-amber-500" />
                                    </div>
                                    <div className="space-y-1 rounded-xl bg-slate-50 p-3">
                                        <div className="flex justify-between font-medium">
                                            <span>Image Similarity</span>
                                            <span className="text-slate-900">{match.image_score}%</span>
                                        </div>
                                        <Progress value={match.image_score} className="h-2 bg-slate-200 [&>div]:bg-rose-500" />
                                    </div>
                                </div>

                                <div className="text-xs font-medium text-slate-500">
                                    ID: {match.id}
                                </div>

                                {match.category ? (
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                                            {match.category}
                                        </Badge>
                                        {match.shared_utilities?.map((utility) => (
                                            <Badge key={utility} variant="outline" className="border-violet-200 bg-violet-50 text-violet-700">
                                                {utility}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : null}

                                {(match.location_address || match.postal_code) ? (
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-900">
                                        <div className="mb-1 flex items-center gap-1 font-medium text-emerald-950">
                                            <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                                            Resident Location
                                        </div>
                                        <p className="leading-relaxed">{match.location_address || "Location not available"}</p>
                                        {match.postal_code ? (
                                            <p className="mt-2 inline-flex rounded-full bg-white px-2.5 py-1 font-semibold text-emerald-700 shadow-sm">
                                                Pincode: {match.postal_code}
                                            </p>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
