"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { detectDuplicatesAction } from "@/ai/actions";
import { Loader2, Copy, AlertTriangle, Check, ExternalLink } from "lucide-react";
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
            <Button onClick={runCheck} variant="outline" className="w-full gap-2 border-dashed">
                <Copy className="w-4 h-4" /> Run AI Duplicate Check
            </Button>
        );
    }

    return (
        <Card className="border-orange-200 bg-orange-50/30">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2 text-orange-800">
                        <AlertTriangle className="w-4 h-4" /> Duplicate Detection
                    </span>
                    {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : (
                        <Button size="sm" variant="ghost" onClick={runCheck} className="h-6 text-xs text-muted-foreground">
                            Re-run
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded mb-2">
                        Error: {error}
                    </div>
                )}

                {matches && matches.length === 0 && (
                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded">
                        <Check className="w-4 h-4" /> No duplicates detected. (0 matches found)
                    </div>
                )}

                {matches && matches.length > 0 && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Found {matches.length} potential duplicate(s):</p>
                        {matches.map((match) => (
                            <div key={match.id} className="bg-background border rounded-md p-3 text-sm space-y-2 shadow-sm">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="font-medium">
                                        <Link href={`/admin/issues/${match.id}`} className="hover:underline flex items-center gap-1">
                                            {match.title || "Untitled Issue"}
                                            <ExternalLink className="w-3 h-3" />
                                        </Link>
                                    </div>
                                    <Badge variant={match.score > 80 ? "destructive" : "secondary"}>
                                        {match.score}% Match
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                                    <div className="space-y-1">
                                        <div className="flex justify-between">
                                            <span>Text Similarity</span>
                                            <span>{match.text_score}%</span>
                                        </div>
                                        <Progress value={match.text_score} className="h-1" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between">
                                            <span>Image Similarity</span>
                                            <span>{match.image_score}%</span>
                                        </div>
                                        <Progress value={match.image_score} className="h-1" />
                                    </div>
                                </div>

                                <div className="text-xs text-muted-foreground pt-1">
                                    ID: {match.id}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
