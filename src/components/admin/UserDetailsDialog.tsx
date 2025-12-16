"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Hourglass, Award, User as UserIcon } from "lucide-react";

type UserStats = {
    totalIssues: number;
    resolvedIssues: number;
    totalPoints: number;
};

type UserData = {
    id: string;
    name: string;
    avatarUrl?: string;
    imageHint?: string;
};

interface UserDetailsDialogProps {
    user: UserData;
    stats: UserStats;
    children: React.ReactNode;
}

export function UserDetailsDialog({ user, stats, children }: UserDetailsDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Citizen Profile</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="flex flex-col items-center gap-2">
                        <Avatar className="h-20 w-20 border-2 border-primary/20">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="text-center">
                            <h3 className="text-xl font-bold font-headline">{user.name}</h3>
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-1">
                                <Badge variant="outline" className="font-normal">Verified Citizen</Badge>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                                <CardTitle className="text-xs font-medium text-muted-foreground">Resolved</CardTitle>
                                <CheckSquare className="h-3 w-3 text-green-600" />
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="text-xl font-bold text-green-600">{stats.resolvedIssues}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                                <CardTitle className="text-xs font-medium text-muted-foreground">Submitted</CardTitle>
                                <Hourglass className="h-3 w-3 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="text-xl font-bold">{stats.totalIssues}</div>
                            </CardContent>
                        </Card>
                        <Card className="col-span-2 bg-primary/5 border-primary/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                                <CardTitle className="text-xs font-medium text-primary">Community Impact</CardTitle>
                                <Award className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="text-2xl font-bold text-primary">{stats.totalPoints} <span className="text-sm font-normal text-muted-foreground">Points</span></div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
