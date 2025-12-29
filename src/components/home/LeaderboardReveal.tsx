"use client";

import { useState } from 'react';
import { Leaderboard } from '@/components/community/Leaderboard';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';
import { User } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface LeaderboardEntry {
    user: User;
    points: number;
    issuesCount: number;
}

interface LeaderboardRevealProps {
    entries: LeaderboardEntry[];
}

export function LeaderboardReveal({ entries }: LeaderboardRevealProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Trophy className="w-4 h-4 text-yellow-600" />
                    Show Local Heroes
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-600" />
                        Community Leaderboard
                    </DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                    <Leaderboard entries={entries} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
