"use client";

import { useState, useTransition } from 'react';
import { Leaderboard } from '@/components/community/Leaderboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, MapPinned, Search, ShieldCheck, Trophy } from 'lucide-react';
import { User, LocalityScoreResult } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface LeaderboardEntry {
    user: User;
    points: number;
    issuesCount: number;
}

interface LeaderboardRevealProps {
    entries: LeaderboardEntry[];
}

export function LeaderboardReveal({ entries }: LeaderboardRevealProps) {
    const [pincode, setPincode] = useState('713103');
    const [result, setResult] = useState<LocalityScoreResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const scoreTone = !result
        ? 'from-slate-500 to-slate-700'
        : result.score < 40
            ? 'from-rose-500 to-red-700'
            : result.score < 70
                ? 'from-amber-400 to-orange-600'
                : 'from-emerald-400 to-teal-700';

    const handleSearch = () => {
        startTransition(async () => {
            setError(null);

            try {
                const response = await fetch(`/api/locality-score/${pincode.trim()}?t=${Date.now()}`, {
                    cache: 'no-store',
                });
                const payload = await response.json();

                if (!response.ok) {
                    throw new Error(payload.message || 'Unable to load locality score.');
                }

                setResult(payload);
            } catch (searchError) {
                setResult(null);
                setError(searchError instanceof Error ? searchError.message : 'Unable to load locality score.');
            }
        });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Trophy className="w-4 h-4 text-yellow-600" />
                    Local Heroes
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-600" />
                        Local Heroes and Locality Score
                    </DialogTitle>
                    <DialogDescription>
                        Search a 6-digit pincode to check the locality civic score, open issues, and top problem categories.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4 grid gap-6 lg:grid-cols-[1.05fr_1.35fr]">
                    <Leaderboard entries={entries} />

                    <Card className="border-border/60 shadow-lg">
                        <CardHeader className="space-y-4">
                            <div className="flex items-center gap-2">
                                <MapPinned className="h-5 w-5 text-primary" />
                                <CardTitle className="text-xl">Pincode Locality Score</CardTitle>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Input
                                    value={pincode}
                                    onChange={(event) => setPincode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="Enter pincode"
                                    className="h-11"
                                />
                                <Button type="button" onClick={handleSearch} disabled={isPending || pincode.length !== 6} className="h-11 gap-2">
                                    <Search className="h-4 w-4" />
                                    {isPending ? 'Checking...' : 'Check Score'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!result && !error ? (
                                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
                                    Enter a pincode like <span className="font-semibold text-foreground">713103</span> to see the civic health score. Base score starts at 100, and each issue lowers it by 10 points.
                                </div>
                            ) : null}

                            {error ? (
                                <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <p>{error}</p>
                                </div>
                            ) : null}

                            {result ? (
                                <div className="space-y-4">
                                    <div className={`rounded-3xl bg-gradient-to-br ${scoreTone} p-6 text-white shadow-xl`}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-sm uppercase tracking-[0.24em] text-white/70">Locality Score</p>
                                                <h3 className="mt-2 text-4xl font-bold">{result.score}/100</h3>
                                                <p className="mt-2 text-sm text-white/80">{result.localityName}</p>
                                            </div>
                                            <div className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
                                                {result.grade}
                                            </div>
                                        </div>
                                        <p className="mt-4 max-w-xl text-sm text-white/85">{result.summary}</p>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                        <div className="rounded-2xl border bg-background p-4">
                                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Issues</p>
                                            <p className="mt-2 text-2xl font-semibold">{result.totalIssues}</p>
                                        </div>
                                        <div className="rounded-2xl border bg-background p-4">
                                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Open Issues</p>
                                            <p className="mt-2 text-2xl font-semibold">{result.openIssues}</p>
                                        </div>
                                        <div className="rounded-2xl border bg-background p-4">
                                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Resolved</p>
                                            <p className="mt-2 text-2xl font-semibold">{result.resolvedIssues}</p>
                                        </div>
                                        <div className="rounded-2xl border bg-background p-4">
                                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Urgent Flags</p>
                                            <p className="mt-2 text-2xl font-semibold">{result.urgentIssues}</p>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border bg-muted/20 p-4">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <ShieldCheck className="h-4 w-4 text-primary" />
                                            Score model
                                        </div>
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            Base score is 100. Each reported issue reduces 10 points. Resolved issues add a small recovery boost, while urgent complaints increase the penalty.
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border bg-background">
                                        <div className="border-b px-4 py-3">
                                            <p className="font-semibold">Problems in this pincode</p>
                                        </div>
                                        <div className="space-y-3 p-4">
                                            {result.issueCounts.length === 0 ? (
                                                <p className="text-sm text-muted-foreground">No reports found for this pincode yet.</p>
                                            ) : (
                                                result.issueCounts.map((issue) => (
                                                    <div key={issue.category} className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3">
                                                        <p className="text-sm font-medium">{issue.category}</p>
                                                        <p className="text-sm text-muted-foreground">{issue.count} reported</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}
