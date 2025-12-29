import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Medal, Star } from "lucide-react";
import { User } from "@/lib/types";

interface LeaderboardEntry {
    user: User;
    points: number;
    issuesCount: number;
}

interface LeaderboardProps {
    entries: LeaderboardEntry[];
}

export function Leaderboard({ entries }: LeaderboardProps) {
    return (
        <Card className="h-full border-border/50 shadow-sm">
            <CardHeader className="p-4 border-b bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Medal className="w-5 h-5 text-yellow-500" />
                    Local Heroes
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {entries.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                        No contributions yet. Be the first!
                    </div>
                ) : (
                    <div className="divide-y">
                        {entries.map((entry, index) => (
                            <div key={entry.user.id} className="flex items-center p-3 hover:bg-muted/30 transition-colors">
                                <div className="flex-shrink-0 w-6 text-center font-bold text-muted-foreground mr-2">
                                    {index + 1}
                                </div>
                                <Avatar className="h-8 w-8 mr-3">
                                    <AvatarImage src={entry.user.avatarUrl} alt={entry.user.name} />
                                    <AvatarFallback className="text-xs">{entry.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-grow min-w-0">
                                    <p className="text-sm font-semibold truncate">{entry.user.name}</p>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Star className="w-3 h-3 text-yellow-500" />
                                            {entry.points} pts
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <UserCheck className="w-3 h-3" />
                                            {entry.issuesCount} issues
                                        </span>
                                    </div>
                                </div>
                                {index === 0 && <Medal className="w-5 h-5 text-yellow-500 ml-2" />}
                                {index === 1 && <Medal className="w-5 h-5 text-gray-400 ml-2" />}
                                {index === 2 && <Medal className="w-5 h-5 text-amber-700 ml-2" />}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
