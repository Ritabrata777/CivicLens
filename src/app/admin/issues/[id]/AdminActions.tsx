
"use client"

import { updateIssueStatusAction } from "@/server/actions";
import { IssueStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTransition } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

    const [pendingStatus, setPendingStatus] = useState<IssueStatus | null>(null);

    const handleUpdateStatus = (newStatus: IssueStatus, notes?: string) => {
        startTransition(async () => {
            let txHash: string | undefined;

            // blockchain verification for critical actions
            if (newStatus !== 'Seen') {
                try {
                    const { isWalletConnected, connectWallet, verifyIssueOnChain } = await import('@/lib/web3');
                    let wallet = await isWalletConnected();
                    if (!wallet) {
                        wallet = await connectWallet();
                    }

                    if (!wallet) {
                        toast({
                            title: "Wallet Required",
                            description: "Please connect your MetaMask wallet to perform this action.",
                            variant: "destructive",
                        });
                        return;
                    }

                    toast({
                        title: "Verifying on Blockchain",
                        description: "Please confirm the transaction in MetaMask...",
                    });

                    txHash = await verifyIssueOnChain(issueId, wallet, newStatus);

                    toast({
                        title: "Transaction Sent",
                        description: "Waiting for confirmation...",
                    });
                } catch (error) {
                    console.error("Blockchain verification failed:", error);
                    toast({
                        title: "Blockchain Error",
                        description: "Failed to verify on chain. Action cancelled.",
                        variant: "destructive",
                    });
                    return;
                }
            }

            const result = await updateIssueStatusAction(issueId, newStatus, notes, txHash);

            if (result.success) {
                toast({
                    title: "Status Updated",
                    description: result.message,
                });
                setPopoverOpen(false);
                setPendingStatus(null);
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
        'Pending': { label: '', variant: 'default' },
    }

    // Removed unused/conflicting handlers onActionClick and confirmAction

    return (
        <div className="space-y-3">
            {/* Removed duplicated top-level Popover which was causing conflicts */}

            {/* Render Buttons */}
            {availableActions.map(status => {
                const config = statusButtonConfig[status];
                if (!config) return null;

                // If it triggers a popover, wrap in PopoverAnchor or just manage state manually
                // Since PopoverTrigger needs a child, and we have multiple buttons...
                // Better approach: Externalize the Popover (done above) and just use state to open it.
                // But Popover needs an anchor.
                // We can use a hidden trigger or attach it to the specific button.
                // Simpler: Just render the buttons. When one is clicked, we open the "Modal" (Popover).
                // But Radix Popover anchors to the trigger.
                // Let's use a Dialog instead? Or just a conditional render of a "modal" type overlay?
                // The previous code used PopoverTrigger around the 'In Progress' button.
                // Since user wants "Reject" -> "Reason", and "In Progress" -> "Note".

                // To keep it simple with multiple triggers:
                // We can map the specific buttons that need it to be triggers.

                const needsPopover = status === 'Rejected' || status === 'In Progress';

                if (needsPopover) {
                    return (
                        <Popover key={status} open={popoverOpen && pendingStatus === status} onOpenChange={(open) => {
                            if (open) {
                                setPendingStatus(status);
                                setNotes('');
                                setPopoverOpen(true);
                            } else {
                                setPopoverOpen(false);
                                setPendingStatus(null);
                            }
                        }}>
                            <PopoverTrigger asChild>
                                <Button
                                    className="w-full"
                                    variant={config.variant}
                                    disabled={isPending}
                                >
                                    {config.label}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" side="bottom" align="end">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">
                                            {status === 'Rejected' ? 'Rejection Reason' : 'Add Progress Note'}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            {status === 'Rejected' ? 'Reason is required.' : 'Optional update note.'}
                                        </p>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor={`notes-${status}`}>Note</Label>
                                        <Textarea
                                            id={`notes-${status}`}
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        />
                                        <Button
                                            onClick={() => {
                                                handleUpdateStatus(status, notes);
                                                setPopoverOpen(false); // Close explicitly on success in handleUpdateStatus, but here for click
                                            }}
                                            disabled={isPending || (status === 'Rejected' && !notes.trim())}
                                            variant={status === 'Rejected' ? 'destructive' : 'default'}
                                        >
                                            Confirm
                                        </Button>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )
                }

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

            {/* Removed duplicated Resolved button manual render */}

            {availableActions.length === 0 && currentStatus !== 'Resolved' && currentStatus !== 'Rejected' && (
                <p className="text-sm text-muted-foreground text-center">No further actions for current status.</p>
            )}
            {(currentStatus === 'Resolved' || currentStatus === 'Rejected') && (
                <p className="text-sm text-muted-foreground text-center font-medium">{`Issue has been ${currentStatus}.`}</p>
            )}
        </div>
    )
}
