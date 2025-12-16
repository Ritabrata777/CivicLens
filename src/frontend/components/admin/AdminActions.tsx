
"use client"

import { updateIssueStatusAction } from "@/backend/server/actions";
import { IssueStatus } from "@/lib/types";
import { Button } from "@/frontend/components/ui/button";
import { useToast } from "@/frontend/hooks/use-toast";
import { useTransition } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/frontend/components/ui/popover";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Label } from "@/frontend/components/ui/label";
import { useState } from "react";

type AdminActionsProps = {
    issueId: string;
    currentStatus: IssueStatus;
}

export function AdminActions({ issueId, currentStatus }: AdminActionsProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const [notes, setNotes] = useState("");
    const [popoverOpen, setPopoverOpen] = useState(false);

    const handleUpdateStatus = (newStatus: IssueStatus, notes?: string) => {
        startTransition(async () => {
            const result = await updateIssueStatusAction(issueId, newStatus, notes);
            if(result.success) {
                toast({
                    title: "Status Updated",
                    description: result.message,
                });
                if(popoverOpen) setPopoverOpen(false);
            } else {
                toast({
                    title: "Error",
                    description: result.message,
                    variant: "destructive",
                });
            }
        });
    }

    const nextStatusMap: Partial<Record<IssueStatus, IssueStatus[]>> = {
        'Pending': ['Seen', 'Rejected'],
        'Seen': ['Accepted', 'Rejected'],
        'Accepted': ['In Progress'],
        'In Progress': ['Resolved'],
    }

    const availableActions = nextStatusMap[currentStatus] || [];

    const statusButtonConfig: Record<IssueStatus, { label: string, variant: "default" | "secondary" | "destructive" | "outline" }> = {
        'Seen': { label: 'Mark as Seen', variant: 'secondary' },
        'Accepted': { label: 'Accept Issue', variant: 'default' },
        'Rejected': { label: 'Reject Issue', variant: 'destructive' },
        'In Progress': { label: 'Update to In Progress', variant: 'default' },
        'Resolved': { label: 'Mark as Resolved', variant: 'default' },
        'Pending': { label: '', variant: 'default'},
    }

    const handleProgressUpdate = () => {
        handleUpdateStatus('In Progress', notes);
        setNotes('');
        setPopoverOpen(false);
    }

    return (
        <div className="space-y-3">
            {availableActions.includes('In Progress') ? (
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button className="w-full" variant="secondary">Update Progress</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Add Progress Note</h4>
                                <p className="text-sm text-muted-foreground">
                                    Provide an update for the community.
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="progress-notes">Notes</Label>
                                <Textarea id="progress-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                                <Button onClick={handleProgressUpdate} disabled={isPending || !notes}>Set to 'In Progress'</Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            ) : null}

            {availableActions.filter(status => status !== 'In Progress').map(status => {
                const config = statusButtonConfig[status];
                if (!config) return null;
                return (
                    <Button 
                        key={status}
                        className="w-full"
                        variant={config.variant}
                        onClick={() => handleUpdateStatus(status)}
                        disabled={isPending}
                    >
                        {config.label}
                    </Button>
                )
            })}
             {currentStatus === 'In Progress' && (
                <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleUpdateStatus('Resolved')}
                    disabled={isPending}
                >
                    Mark as Resolved
                </Button>
            )}

            {availableActions.length === 0 && currentStatus !== 'Resolved' && currentStatus !== 'Rejected' && (
                <p className="text-sm text-muted-foreground text-center">No further actions for current status.</p>
            )}
             {(currentStatus === 'Resolved' || currentStatus === 'Rejected') && (
                <p className="text-sm text-muted-foreground text-center font-medium">{`Issue has been ${currentStatus}.`}</p>
            )}
        </div>
    )
}
